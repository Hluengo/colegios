import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock withRetry - create the mock function inside the factory
vi.mock('./withRetry', () => ({ 
  withRetry: vi.fn((fn: any) => fn())
}));

// Mock supabase client to avoid real network calls
vi.mock('./supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        limit: () => Promise.resolve({ data: [{ id: '1' }], error: null }),
      }),
    }),
  },
  checkSupabaseConnection: vi.fn().mockResolvedValue(true),
  setSessionToken: vi.fn(),
  getSessionToken: vi.fn(() => null),
  clearSessionToken: vi.fn(),
  subscribeAuthChanges: vi.fn(),
  unsubscribeAuthChanges: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

import { checkSupabaseHealth } from './health';
import { withRetry } from './withRetry';

describe('checkSupabaseHealth', () => {
  beforeEach(() => {
    // Reset mock between tests
    vi.mocked(withRetry).mockImplementation((fn: any) => fn());
  });

  it('returns ok true when withRetry returns no error', async () => {
    const res = await checkSupabaseHealth();
    expect(res).toEqual({ ok: true });
  });

  it('returns ok false when withRetry throws', async () => {
    // Override withRetry to throw
    vi.mocked(withRetry).mockImplementationOnce(() => {
      throw new Error('boom');
    });
    
    const res = await checkSupabaseHealth();
    expect(res.ok).toBe(false);
    expect(res).toHaveProperty('message');
  });
});

