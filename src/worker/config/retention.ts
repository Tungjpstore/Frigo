import { Env } from '../types';

// Retention windows for scheduled cleanup (days). Rows are deleted only after
// their natural expiry (OTP/session `expires_at`) or after reaching a terminal
// state (queue jobs) plus this grace period, so operators keep a debugging
// window and cron replays never remove live data.
// Queue tombstones additionally require a matching terminal scan and no reserved
// quota. All quota periods/reservations/history are retained without a TTL.
export const DEFAULT_RETENTION_DAYS = {
  otp: 7,
  sessions: 30,
  readyJobs: 30,
  failedJobs: 90,
} as const;

export interface RetentionConfig {
  otpDays: number;
  sessionDays: number;
  readyJobDays: number;
  failedJobDays: number;
}

function readDays(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 3650) return fallback;
  return Math.floor(parsed);
}

export function getRetentionConfig(env: Env): RetentionConfig {
  return {
    otpDays: readDays(env.CLEANUP_OTP_RETENTION_DAYS, DEFAULT_RETENTION_DAYS.otp),
    sessionDays: readDays(env.CLEANUP_SESSION_RETENTION_DAYS, DEFAULT_RETENTION_DAYS.sessions),
    readyJobDays: readDays(env.CLEANUP_READY_JOB_RETENTION_DAYS, DEFAULT_RETENTION_DAYS.readyJobs),
    failedJobDays: readDays(env.CLEANUP_FAILED_JOB_RETENTION_DAYS, DEFAULT_RETENTION_DAYS.failedJobs),
  };
}
