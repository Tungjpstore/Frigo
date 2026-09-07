// Persistent write-outbox for offline-safe mutations (S3 fix).
//
// Problem it solves: previously every failed write (including real server
// rejections like 401/5xx) was silently swallowed and replaced with a fabricated
// "success" + fake local id, so users believed data was saved when it was not,
// and offline writes were never pushed to the server (lost on next refresh).
//
// New behaviour (see services/api.ts):
//   - Genuinely offline  -> optimistic local apply + enqueue the raw request here
//                           so it can be replayed when connectivity returns.
//   - Server rejects     -> the caller throws a real error (never fabricates).
//
// The queue stores a minimal, serializable description of the original request
// (path + method + body). Replaying it via the API client re-attaches fresh auth
// headers, so we do not persist tokens here.

const STORAGE_KEY = 'frigo_sync_outbox_v1';

export interface PendingOp {
  id: string;
  /** Stable operation identifier used for server idempotency/audit. */
  operationId?: string;
  ts: number;
  /** API path relative to BASE_URL, e.g. "/inventory" */
  path: string;
  method: string;
  /** JSON request body string, if any */
  body?: string;
  /** Headers required to preserve a command contract during replay. */
  headers?: Record<string, string>;
  /** Human-readable label for the UI ("Thêm thịt ba chỉ") */
  label: string;
  /** Identity that created the operation; prevents replay into another tenant. */
  userId?: string;
  householdId?: string;
  /** Optional caller-provided key for mutations that are safe to coalesce. */
  dedupeKey?: string;
}

export interface PendingScope {
  userId: string;
  householdId: string;
}

type Listener = (count: number) => void;
const listeners = new Set<Listener>();

function load(): PendingOp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as PendingOp[]) : [];
  } catch {
    return [];
  }
}

function save(ops: PendingOp[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
  } catch {
    // storage full / unavailable — nothing sensible to do; keep in-memory only
  }
  emit();
}

function emit(): void {
  const n = load().length;
  listeners.forEach((fn) => {
    try {
      fn(n);
    } catch {
      // ignore listener errors
    }
  });
}

export function pushOp(op: Omit<PendingOp, 'id' | 'ts'>): PendingOp {
  const operationId = op.operationId || `op_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const full: PendingOp = {
    ...op,
    operationId,
    id: operationId,
    ts: Date.now(),
  };
  const ops = load();

  // Only callers that explicitly opt in may coalesce operations. Blindly
  // deduplicating by body would lose legitimate repeated actions (for example,
  // cooking the same recipe twice while offline).
  if (full.dedupeKey) {
    const duplicate = ops.find(
      (existing) =>
        existing.dedupeKey === full.dedupeKey &&
        existing.userId === full.userId &&
        existing.householdId === full.householdId
    );
    if (duplicate) {
      emit();
      return duplicate;
    }
  }

  ops.push(full);
  save(ops);
  return full;
}

/** Return a snapshot for diagnostics/UI without exposing the mutable queue. */
export function getPendingOps(): PendingOp[] {
  return load().map((op) => ({ ...op }));
}

/**
 * Adopt queued mutations when a guest household is migrated into a newly
 * authenticated household. Only an exact source scope can be rebound.
 */
export function rebindPendingOps(from: PendingScope, to: PendingScope): number {
  if (from.userId === to.userId && from.householdId === to.householdId) return 0;

  const ops = load();
  let rebound = 0;
  let changed = false;
  const next: PendingOp[] = [];
  for (const op of ops) {
    if (op.userId !== from.userId || op.householdId !== from.householdId) {
      next.push(op);
      continue;
    }

    const candidate = { ...op, ...to };
    if (
      candidate.dedupeKey &&
      next.some(
        (existing) =>
          existing.dedupeKey === candidate.dedupeKey &&
          existing.userId === to.userId &&
          existing.householdId === to.householdId
      )
    ) {
      // The source operation is intentionally discarded because an equivalent
      // target-scope command is already queued. Persist this removal even when
      // no operation was rebound; otherwise it would remain stranded forever.
      changed = true;
      continue;
    }
    next.push(candidate);
    rebound++;
    changed = true;
  }

  if (changed) save(next);
  return rebound;
}

export function removeOp(id: string): void {
  const ops = load();
  const next = ops.filter((o) => o.id !== id);
  if (next.length !== ops.length) save(next);
}

export function pendingCount(): number {
  return load().length;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  // fire immediately with current count
  try {
    fn(load().length);
  } catch {
    /* ignore */
  }
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Replay all queued writes. `replay` performs the actual network request for one
 * op and must resolve on success / reject on failure. A rejected replay stops the
 * flush (we preserve ordering and try again next time). A non-retryable HTTP error
 * (4xx that is not 401/403) drops that op so the queue cannot deadlock on bad input.
 */
async function flushOnce(
  replay: (op: PendingOp) => Promise<void>,
  isNonRetryable?: (err: unknown) => boolean,
  options?: { scope?: PendingScope | (() => PendingScope) }
): Promise<{ attempted: number; remaining: number }> {
  const ops = load();
  let attempted = 0;
  for (const op of ops) {
    // Operations from a different account/household stay queued for that
    // identity. Replaying them with the current JWT would be a data leak.
    const scope = typeof options?.scope === 'function' ? options.scope() : options?.scope;
    if (
      scope &&
      (op.userId !== scope.userId || op.householdId !== scope.householdId)
    ) {
      continue;
    }

    try {
      await replay(op);
      removeOp(op.id);
      attempted++;
    } catch (err) {
      if (isNonRetryable && isNonRetryable(err)) {
        // Server definitively rejected this op — drop it to avoid a stuck queue.
        removeOp(op.id);
        continue;
      }
      // Still offline or transient error — stop, keep the rest queued.
      break;
    }
  }
  return { attempted, remaining: load().length };
}

// Serialize flushes in this tab. Without a mutex, `online`, `load`, and the
// manual retry action can all observe the same operation before it is removed.
let flushChain: Promise<void> = Promise.resolve();

export function flush(
  replay: (op: PendingOp) => Promise<void>,
  isNonRetryable?: (err: unknown) => boolean,
  options?: { scope?: PendingScope | (() => PendingScope) }
): Promise<{ attempted: number; remaining: number }> {
  const result = flushChain.then(() => flushOnce(replay, isNonRetryable, options));
  flushChain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

/**
 * Wire browser connectivity events so queued writes auto-replay when the device
 * comes back online. `retry` should call services/api retryPendingWrites().
 * Safe to call more than once (idempotent guard).
 */
let initialized = false;
export function initSync(retry: () => Promise<unknown>): void {
  if (initialized) return;
  initialized = true;
  const onUp = () => {
    void retry();
  };
  window.addEventListener('online', onUp);
  // Opportunistic flush shortly after load too (covers already-online restarts).
  window.addEventListener('load', () => {
    if (navigator.onLine) void retry();
  });
}
