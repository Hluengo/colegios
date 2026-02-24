import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../withRetry', () => ({ withRetry: (fn: any) => fn() }));
vi.mock('../utils/logger', () => ({ debug: () => undefined, error: () => undefined }));

describe('admin more branches', () => {
  beforeEach(() => vi.resetModules());

  it('inviteTenantUser lanza si auth.signUp devuelve error', async () => {
    vi.mock('./supabaseClient', () => ({
      supabase: {
        auth: {
          signUp: () => ({ then: (resolve: any) => resolve({ data: null, error: { message: 'signup failed' } }) }),
        },
      },
    }));

    const { inviteTenantUser } = await import('../admin');
    await expect(inviteTenantUser('t1', { email: 'a@b.c' })).rejects.toBeDefined();
  });

  it('inviteTenantUser rechaza si signUp no retorna user', async () => {
    vi.mock('./supabaseClient', () => ({
      supabase: {
        auth: {
          signUp: () => ({ then: (resolve: any) => resolve({ data: {}, error: null }) }),
        },
      },
    }));

    const { inviteTenantUser } = await import('../admin');
    await expect(inviteTenantUser('t1', { email: 'no-user@x.y' })).rejects.toBeDefined();
  });
});
