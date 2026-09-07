/**
 * Email delivery service for Frigo Workers.
 *
 * Primary: Cloudflare Workers native email (send_email binding, Paid plan) —
 *          no API key, no third party. Requires the destination address (or
 *          whole domain) to be verified in Cloudflare Email Routing.
 * Fallback 1: Resend HTTP API (if RESEND_API_KEY secret is configured)
 * Fallback 2: Cloudflare MailChannels (free, no key — subject to CF policy)
 *
 * All sends are fire-and-log: email failure never blocks OTP flow because the
 * code is persisted in D1 (auth_otps) and dev environments surface it via devOtp.
 */

import { Env } from '../types';
// Runtime module: EmailMessage only exists via this import, not as a global.
import { EmailMessage } from 'cloudflare:email';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}

export interface EmailResult {
  sent: boolean;
  provider: 'workers-email' | 'resend' | 'none';
  error?: string;
}

const FROM_NAME = 'Frigo';
const FROM_EMAIL = 'no-reply@frigo.tungjpstore.net';

// Minimal MIME message for the native send_email binding (raw MIME format).
function buildMimeMessage(params: SendEmailParams): string {
  const boundary = `frigo_${crypto.randomUUID().replace(/-/g, '')}`;
  const headers = [
    `From: ${params.fromName || FROM_NAME} <${FROM_EMAIL}>`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `Date: ${new Date().toUTCString()}`,
    'X-Frigo-Kind: transactional',
  ].join('\r\n');

  const textPart = [
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    params.text || params.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  ].join('\r\n');

  const htmlPart = [
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    params.html,
    `--${boundary}--`,
  ].join('\r\n');

  return `${headers}\r\n\r\n${textPart}\r\n${htmlPart}`;
}

export async function sendEmail(
  env: Env,
  params: SendEmailParams
): Promise<EmailResult> {
  // 0. Native Workers email (Paid plan, no API key). The binding only accepts
  // a verified destination — errors are logged and we fall through.
  if (env.SEND_EMAIL) {
    try {
      const message = buildMimeMessage(params);
      await env.SEND_EMAIL.send(
        new EmailMessage(FROM_EMAIL, params.to, message)
      );
      return { sent: true, provider: 'workers-email' };
    } catch (err: any) {
      console.error('[email] workers-email send failed:', err?.message);
      // fall through to HTTP providers
    }
  }

  const from = `${params.fromName || FROM_NAME} <${FROM_EMAIL}>`;

  // 1. Resend (preferred — deliverability, bounce handling, logs)
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
        // Email send must not hang the request path
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { sent: true, provider: 'resend' };
      const errText = await res.text().catch(() => '');
      return { sent: false, provider: 'resend', error: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    } catch (err: any) {
      return { sent: false, provider: 'resend', error: err?.message || 'network error' };
    }
  }

  // 2. MailChannels fallback removed: Cloudflare ended free MailChannels
  // support for Workers (returns HTTP 401 since 2024). Configure RESEND_API_KEY
  // as a Wrangler secret for a reliable HTTP fallback instead.
  return { sent: false, provider: 'none', error: 'No email provider available (workers-email failed, RESEND_API_KEY not set)' };
}

/**
 * Build Frigo-styled OTP email. Purpose-specific copy in Vietnamese.
 */
export function buildOtpEmail(code: string, purpose: 'register' | 'forgot_password' | 'login'): { subject: string; html: string; text: string } {
  const action =
    purpose === 'register'
      ? 'xác thực tài khoản'
      : purpose === 'forgot_password'
        ? 'đặt lại mật khẩu'
        : 'đăng nhập';

  const subject = `Mã xác thực Frigo: ${code}`;

  const text = `Mã ${action} của bạn là: ${code}\nMã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.\n— Frigo: Tủ lạnh thông minh, bữa ăn trọn vị Việt`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAF9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAF9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
        <tr><td style="background:#059669;padding:24px 32px;text-align:center;">
          <span style="font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;">🥬 Frigo</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:18px;color:#0F172A;">Mã ${action}</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.5;">Nhập mã sau vào ứng dụng Frigo để tiếp tục. Mã có hiệu lực trong <strong>10 phút</strong>.</p>
          <div style="background:#E6F4EA;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#059669;font-family:'SF Mono',Menlo,monospace;">${code}</span>
          </div>
          <p style="margin:0 0 4px;font-size:13px;color:#475569;">Không chia sẻ mã này với bất kỳ ai — nhân viên Frigo không bao giờ hỏi mã của bạn.</p>
          <p style="margin:0;font-size:13px;color:#94A3B8;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>
        </td></tr>
        <tr><td style="background:#F8FAF9;padding:16px 32px;text-align:center;">
          <span style="font-size:12px;color:#94A3B8;">Frigo — Tủ lạnh thông minh, bữa ăn trọn vị Việt</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
