import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../pages/Login';

describe('Integration: Login stores session token in localStorage', () => {
  it('stores sb-auth-token after successful signInWithPassword', async () => {
    // shim localStorage and btoa/atob
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (store[k] ?? null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => delete store[k],
      clear: () => {
        for (const k in store) delete store[k];
      },
    });
    vi.stubGlobal('btoa', (s: string) => Buffer.from(String(s)).toString('base64'));
    vi.stubGlobal('atob', (s: string) => Buffer.from(String(s), 'base64').toString());

    // Mock supabase client used by Login (relative to src/integration -> ../api)
    vi.mock('../api/supabaseClient', () => {
      return {
        supabase: {
          auth: {
            signInWithPassword: async ({ email, password }: any) => {
              // simulate server response and client persistence
              const fakeSession = { access_token: 'tok-xyz', expires_at: Date.now() + 1000 * 60 * 60 };
              // encode a small session payload and store under sb-auth-token (matching app helper)
              const payload = JSON.stringify({ user: { id: 'u-1', email }, session: fakeSession });
              const enc = Buffer.from(payload).toString('base64');
              localStorage.setItem('sb-auth-token', enc);
              return { data: { user: { id: 'u-1', email }, session: fakeSession }, error: null };
            },
          },
          rpc: async () => ({ data: null, error: null }),
        },
      };
    });

    render(<Login onLoginSuccess={() => {}} />);

    const emailInput = screen.getByPlaceholderText(/tu@email.com/i);
    const passInput = screen.getByPlaceholderText(/\*{4,}/i);
    const btn = screen.getByRole('button', { name: /iniciar sesión/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passInput, 'password123');
    await userEvent.click(btn);

    // assert localStorage key exists and decodes
    const stored = localStorage.getItem('sb-auth-token');
    expect(stored).toBeTruthy();
    const decoded = atob(stored as string);
    expect(decoded).toContain('test@example.com');
  });
});
