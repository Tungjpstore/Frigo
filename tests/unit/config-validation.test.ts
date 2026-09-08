import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../../src/worker/config/validation';
import type { Env } from '../../src/worker/types';

function productionEnv(overrides: Partial<Env> = {}): Env {
  return {
    ENVIRONMENT: 'production',
    APP_URL: 'https://frigo.tungjpstore.net',
    AI_MOCK_MODE: 'false',
    SCAN_QUEUE_MODE: 'async',
    WEEK_SCHEMA_MODE: 'dual',
    DB: {} as Env['DB'],
    CACHE: {} as Env['CACHE'],
    AI: {},
    SCAN_QUEUE: {} as Env['SCAN_QUEUE'],
    JWT_SECRET: 's'.repeat(40),
    OTP_HASH_SECRET: 'otp'.repeat(16),
    ...overrides,
  };
}

describe('validateEnvironment', () => {
  it('accepts a well-formed production configuration', () => {
    const result = validateEnvironment(productionEnv());
    expect(result.ok).toBe(true);
    expect(result.fatal).toEqual([]);
    expect(result.environment).toBe('production');
  });

  it('accepts a valid development configuration without any bindings or secrets', () => {
    const result = validateEnvironment({ ENVIRONMENT: 'development', AI_MOCK_MODE: 'true' } as Env);
    expect(result.ok).toBe(true);
    expect(result.fatal).toEqual([]);
  });

  it('rejects AI mock mode in production', () => {
    const result = validateEnvironment(productionEnv({ AI_MOCK_MODE: 'true' }));
    expect(result.ok).toBe(false);
    expect(result.fatal.map((i) => i.code)).toContain('CONFIG_MOCK_MODE_IN_PRODUCTION');
  });

  it('rejects a localhost APP_URL in production', () => {
    const result = validateEnvironment(productionEnv({ APP_URL: 'http://localhost:5173' }));
    expect(result.ok).toBe(false);
    expect(result.fatal.map((i) => i.code)).toContain('CONFIG_PRODUCTION_APP_URL');
  });

  it('rejects a loopback IP in the APP_URL host', () => {
    const result = validateEnvironment(productionEnv({ APP_URL: 'http://127.0.0.1:8787' }));
    expect(result.ok).toBe(false);
    expect(result.fatal.map((i) => i.code)).toContain('CONFIG_PRODUCTION_APP_URL');
  });

  it.each([undefined, '', 'https://', 'ftp://frigo.example.com', 'http://[::1]:8787', 'https://user:password@frigo.example.com'])
    ('rejects an unusable production APP_URL (%s) without throwing', (APP_URL) => {
      const result = validateEnvironment(productionEnv({ APP_URL }));
      expect(result.ok).toBe(false);
      expect(result.fatal.map((issue) => issue.code)).toContain('CONFIG_PRODUCTION_APP_URL');
      expect(JSON.stringify(result)).not.toContain('user:password');
    });

  it('rejects a missing required D1 binding in production', () => {
    const result = validateEnvironment(productionEnv({ DB: undefined }));
    expect(result.ok).toBe(false);
    expect(result.fatal.map((i) => i.code)).toContain('CONFIG_BINDING_DB_MISSING');
  });

  it('rejects a missing CACHE binding in production (revocation/rate-limit dependency)', () => {
    const result = validateEnvironment(productionEnv({ CACHE: undefined }));
    expect(result.ok).toBe(false);
    expect(result.fatal.map((i) => i.code)).toContain('CONFIG_BINDING_CACHE_MISSING');
  });

  it('rejects missing JWT_SECRET in production', () => {
    const result = validateEnvironment(productionEnv({ JWT_SECRET: undefined }));
    expect(result.ok).toBe(false);
    expect(result.fatal.map((i) => i.code)).toContain('CONFIG_JWT_SECRET_MISSING');
  });

  it.each([undefined, '', '   '])('rejects absent or blank OTP_HASH_SECRET (%s) in production', (OTP_HASH_SECRET) => {
    const result = validateEnvironment(productionEnv({ OTP_HASH_SECRET }));
    expect(result.ok).toBe(false);
    expect(result.fatal.map((issue) => issue.code)).toContain('CONFIG_OTP_HASH_SECRET_MISSING');
  });

  it('rejects legacy Week schema mode and sync queue mode in production', () => {
    const result = validateEnvironment(productionEnv({ WEEK_SCHEMA_MODE: 'legacy', SCAN_QUEUE_MODE: 'sync' }));
    const codes = result.fatal.map((i) => i.code);
    expect(codes).toContain('CONFIG_WEEK_SCHEMA_MODE');
    expect(codes).toContain('CONFIG_SCAN_QUEUE_MODE');
  });

  it('does not require an AI binding when mock mode is enabled (feature disabled)', () => {
    const result = validateEnvironment(
      productionEnv({ AI_MOCK_MODE: 'true', AI: undefined, SCAN_QUEUE: undefined, SCAN_QUEUE_MODE: 'sync' })
    );
    const codes = result.fatal.map((i) => i.code);
    expect(codes).not.toContain('CONFIG_AI_BINDING_MISSING');
    expect(codes).not.toContain('CONFIG_QUEUE_BINDING_MISSING');
  });

  it('requires the AI binding when mock mode is off', () => {
    const result = validateEnvironment(productionEnv({ AI: undefined }));
    expect(result.fatal.map((i) => i.code)).toContain('CONFIG_AI_BINDING_MISSING');
  });

  it('treats a missing Turnstile secret as a warning, not a blocker', () => {
    const result = validateEnvironment(productionEnv({ TURNSTILE_SITE_KEY: '0xsite' }));
    expect(result.ok).toBe(true);
    expect(result.warnings.map((i) => i.code)).toContain('CONFIG_TURNSTILE_MISSING_SECRET');
  });

  it('treats absent optional providers as warnings only (no secret required when disabled)', () => {
    const result = validateEnvironment(productionEnv({ RESEND_API_KEY: undefined, PLUS_GRANT_SECRET: undefined }));
    expect(result.ok).toBe(true);
    const codes = result.warnings.map((i) => i.code);
    expect(codes).toContain('CONFIG_EMAIL_DELIVERY_UNAVAILABLE');
    expect(codes).toContain('CONFIG_PLUS_GRANT_SECRET_MISSING');
    expect(result.fatal).toEqual([]);
  });

  it('never embeds secret values in diagnostics', () => {
    const secretValue = 'sk_do_not_leak_9f8e7d6c';
    const result = validateEnvironment(productionEnv({ RESEND_API_KEY: secretValue, TURNSTILE_SECRET_KEY: secretValue, OTP_HASH_SECRET: secretValue }));
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(secretValue);
  });
});
