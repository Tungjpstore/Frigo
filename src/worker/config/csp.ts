// Centralized Content-Security-Policy builders. public/_headers mirrors the
// SPA policy for static-asset serving; keep the two in sync when editing.

export function apiCsp(): string {
  return "default-src 'none'; frame-ancestors 'none'";
}

/**
 * SEC-CSP: the production bundle contains no inline scripts (verified against
 * dist/client/index.html), so script-src omits 'unsafe-inline'. style-src
 * still requires it: CookingModePage/WeekSetupPage/WeekShoppingPage bind
 * dynamic width style attributes that CSP cannot allowlist without a nonce
 * redesign. See docs/HOPLITE_HANDOFF.md before attempting to drop it.
 */
export function spaCsp(): string {
  return [
    "default-src 'self'",
    // Google OAuth (GSI) and Turnstile challenge scripts
    "script-src 'self' https://accounts.google.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' https://api.resend.com https://challenges.cloudflare.com https://oauth2.googleapis.com",
    "frame-src https://accounts.google.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}
