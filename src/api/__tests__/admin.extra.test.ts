import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => vi.resetModules());

// Mock the supabase client (relative path from this test file)
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: async ({ email }) => ({ data: { user: { id: 'u1', email } }, error: null }),
    },
    from: (table) => ({
      update: () => ({ eq: () => ({ then: (resolve) => resolve({ error: new Error('profile update failed') }) }) }),
    }),
  },
}));

describe('admin extra branches', () => {
  it('inviteTenantUser retorna user aun cuando la actualización de perfil falla', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const { inviteTenantUser } = await import('../admin');

    const user = await inviteTenantUser('t1', { email: 'a@b.com', fullName: 'A B' });
    expect(user).toBeDefined();
    expect(user.id).toBe('u1');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
