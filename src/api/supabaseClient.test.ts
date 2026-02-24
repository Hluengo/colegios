import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as sc from './supabaseClient';

beforeEach(() => {
  vi.restoreAllMocks();
  // Provide a simple localStorage shim for node test environment
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    getItem: (k: string) => (store[k] ?? null),
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k in store) delete store[k];
    },
  });
  // Ensure btoa/atob exist in the test environment
  vi.stubGlobal('btoa', (s: string) => Buffer.from(String(s)).toString('base64'));
  vi.stubGlobal('atob', (s: string) => Buffer.from(String(s), 'base64').toString());
});

describe('supabaseClient helpers', () => {
  it('set/get/clear session token', () => {
    sc.setSessionToken('my-secret');
    const stored = localStorage.getItem('sb-auth-token');
    expect(stored).toBeTruthy();
    expect(sc.getSessionToken()).toBe('my-secret');
    sc.clearSessionToken();
    expect(sc.getSessionToken()).toBeNull();
  });

  it('checkSupabaseConnection returns true when fetch ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true } as any)));
    const ok = await sc.checkSupabaseConnection();
    expect(ok).toBe(true);
  });

  it('checkSupabaseConnection returns false when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('fail'); }));
    const ok = await sc.checkSupabaseConnection();
    expect(ok).toBe(false);
  });

  it('subscribeAuthChanges registers and unsubscribeAuthChanges unsubscribes', () => {
    const unsub = vi.fn();
    const onAuth = vi.fn((cb) => ({ data: { subscription: { unsubscribe: unsub } } }));
    // replace nested auth listener implementation
    (sc as any).supabase.auth = { onAuthStateChange: onAuth };

    const cb = vi.fn();
    sc.subscribeAuthChanges(cb);
    expect(onAuth).toHaveBeenCalledWith(cb);

    sc.unsubscribeAuthChanges();
    expect(unsub).toHaveBeenCalled();
  });
});

