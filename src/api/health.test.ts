import { describe, it, expect, vi } from 'vitest';

describe('checkSupabaseHealth', () => {
  it('returns ok true when withRetry returns no error', async () => {
    vi.resetModules();
    vi.doMock('./withRetry', () => ({ withRetry: (fn: any) => fn() }));
    const { checkSupabaseHealth } = await import('./health');
    const res = await checkSupabaseHealth();
    expect(res).toEqual({ ok: true });
  });

  it('returns ok false when withRetry throws', async () => {
    vi.resetModules();
    vi.doMock('./withRetry', () => ({ withRetry: () => { throw new Error('boom'); } }));
    const { checkSupabaseHealth } = await import('./health');
    const res = await checkSupabaseHealth();
    expect(res.ok).toBe(false);
    expect(res).toHaveProperty('message');
  });
});

