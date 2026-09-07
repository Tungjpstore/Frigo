import { MiddlewareHandler } from 'hono';
import { Env } from '../types';
import { validateEnvironment } from '../config/validation';

/**
 * Fail-closed gate for dangerous production configuration. Runs before route
 * handlers; development/staging deployments are never gated. The diagnostic
 * is sanitized: error codes only, never secret values or binding identifiers.
 */
export const productionConfigGate: MiddlewareHandler<{ Bindings: Env; Variables: { requestId: string } }> = async (
  c,
  next
) => {
  if ((c.env.ENVIRONMENT || 'development') !== 'production') {
    await next();
    return;
  }
  const report = validateEnvironment(c.env);
  if (report.fatal.length > 0) {
    console.error(
      JSON.stringify({
        level: 'error',
        requestId: c.get('requestId'),
        code: 'CONFIG_INVALID',
        issues: report.fatal.map((issue) => issue.code),
        message: 'Production configuration gate rejected the deployment.',
      })
    );
    c.header('Cache-Control', 'no-store');
    return c.json(
      {
        error: 'Cấu hình sản xuất không hợp lệ. Vui lòng liên hệ quản trị viên.',
        code: 'CONFIG_INVALID',
        issues: report.fatal.map((issue) => issue.code),
      },
      503
    );
  }
  await next();
};
