# Scan Queue Contract

`frigo-scan-queue` uses at-least-once delivery. The Worker consumer accepts
only versioned, tenant-scoped messages:

```json
{
  "type": "scan.process.v1",
  "jobId": "scan_job_scan_123",
  "scanId": "scan_123",
  "userId": "user_123",
  "householdId": "household_123",
  "imageKey": "users/user_123/scans/scan_123/original.webp",
  "scanType": "fridge",
  "idempotencyKey": "scan_123:v1"
}
```

The consumer persists `scan_queue_jobs` and transitions both the job and scan
through `pending -> processing -> ready` or `failed`. A duplicate delivery is
acknowledged without invoking AI again. A processing lease older than ten
minutes may be reclaimed after a crashed isolate. Retryable AI/R2 failures are
requeued for up to `max_attempts` (default 3); invalid messages, missing scans,
missing images, and tenant conflicts are permanent failures and are acked after
being logged (jobs with a valid scan are also recorded as `failed`). The
production consumer is configured with the Cloudflare dead-letter queue
`frigo-scan-dlq` for retained poison-message payloads after retry exhaustion.

Before sending jobs, apply migration `0012_scan_queue_jobs.sql` to the target
D1 database and verify with `pnpm check:migrations`/the remote schema gate.

## Canary rollout

`SCAN_QUEUE_MODE=async` is the production setting after provider smoke
validation. Use `SCAN_QUEUE_MODE=sync` as the rollback switch if queue health
degrades, then send a small test cohort after recovery,
and watch queue metrics plus `scan_queue_jobs` status transitions. Roll back to
`sync` if retry rate, consumer lag, or failed jobs increase; pending scans can
then be reprocessed by the synchronous endpoint without changing the D1 schema.
