// OTP verification relies on a shared counter to enforce brute-force limits.
// Without KV, allowing verification would silently remove that protection.
export function isOtpProtectionAvailable(env: { CACHE?: unknown }): boolean {
  return Boolean(env.CACHE);
}

// Password-reset OTPs are consumed by /auth/reset-password, not by the
// preliminary verify endpoint (which only validates the code and issues a
// short-lived reset token).
export function shouldConsumeOtpOnVerify(purpose: string): boolean {
  return purpose !== 'forgot_password';
}
