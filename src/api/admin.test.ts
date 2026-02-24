import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mockar el cliente de supabase usado por el módulo
vi.mock('./supabaseClient', () => {
  const from = vi.fn();
  const rpc = vi.fn();
  const auth = { signUp: vi.fn() };
  const storage = { from: vi.fn() };
  return { supabase: { from, rpc, auth, storage } };
});

import * as admin from './admin';
import { supabase } from './supabaseClient';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('src/api/admin', () => {
  it('listTenants devuelve datos cuando hay resultados', async () => {
    // preparar mock: .from('tenants').select().order() -> Promise<{data, error}>
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        order: () => Promise.resolve({ data: [{ id: 't1', name: 'Colegio' }], error: null }),
      }),
    }));

    const res = await admin.listTenants();
    expect(res).toBeInstanceOf(Array);
    expect(res[0]).toHaveProperty('id', 't1');
  });

  it('createStudent inserta y devuelve la fila creada', async () => {
    const created = { id: 's1', first_name: 'Juan' };
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: created, error: null }),
        }),
      }),
    }));

    const res = await admin.createStudent('tenant1', { first_name: 'Juan' });
    expect(res).toHaveProperty('id', 's1');
    expect(res).toHaveProperty('first_name', 'Juan');
  });

  it('importStudents lanza error si la lista está vacía', async () => {
    await expect(admin.importStudents('t1', [])).rejects.toThrow('No hay estudiantes para importar');
  });

  it('importStudents inserta registros y devuelve datos', async () => {
    const records = [{ first_name: 'Ana' }];
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      insert: (recs: any) => ({
        select: () => Promise.resolve({ data: recs, error: null }),
      }),
    }));

    const res = await admin.importStudents('t1', records as any);
    expect(res[0]).toHaveProperty('tenant_id', 't1');
    expect(res[0]).toHaveProperty('first_name', 'Ana');
  });

  it('inviteTenantUser usa auth.signUp y devuelve user', async () => {
    // mock auth.signUp
    (supabase.auth.signUp as unknown as any).mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    // mock update profile (from(...).update().eq()) - update().eq() chain
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }));

    const user = await admin.inviteTenantUser('t1', { email: 'a@b.c' });
    expect(user).toHaveProperty('id', 'u1');
  });
});
