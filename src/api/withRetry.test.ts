import { describe, expect, it } from 'vitest';
import { withRetry } from './withRetry';

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = () => Promise.resolve({ data: 123, error: null });
    await expect(withRetry(fn, { retries: 0, timeoutMs: 50 })).resolves.toEqual({
      data: 123,
      error: null,
    });
  });

  it('retries retryable thrown errors and succeeds', async () => {
    let calls = 0;
    const fn = async () => {
      calls += 1;
      if (calls < 3) {
        const err = new Error('network fail');
        (err as Error & { code?: string }).code = 'ETIMEDOUT';
        throw err;
      }
      return { ok: true };
    };

    await expect(
      withRetry(fn, { retries: 3, delayMs: 1, timeoutMs: 100 }),
    ).resolves.toEqual({ ok: true });
    expect(calls).toBe(3);
  });

  it('retries retryable result.error and returns last result', async () => {
    let calls = 0;
    const fn = async () => {
      calls += 1;
      if (calls < 2) {
        return { data: null, error: { message: 'failed to fetch' } };
      }
      return { data: 'ok', error: null };
    };

    await expect(withRetry(fn, { retries: 2, delayMs: 1 })).resolves.toEqual({
      data: 'ok',
      error: null,
    });
    expect(calls).toBe(2);
  });

  it('does not retry non-retryable errors', async () => {
    const fn = async () => {
      throw new Error('validation failed');
    };

    await expect(withRetry(fn, { retries: 3, delayMs: 1 })).rejects.toThrow(
      'validation failed',
    );
  });

  it('fails with timeout error when promise does not resolve in time', async () => {
    const never = () => new Promise(() => {});
    await expect(withRetry(never, { retries: 0, timeoutMs: 5 })).rejects.toThrow(
      'Timeout de red',
    );
  });
});
