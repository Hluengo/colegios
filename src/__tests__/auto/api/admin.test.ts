import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../api/supabaseClient', () => {
  const from = vi.fn();
  const rpc = vi.fn();
  const auth = { signUp: vi.fn() };
  const storage = { from: vi.fn() };
  return { supabase: { from, rpc, auth, storage } };
});

import * as admin from '../../../api/admin';
import { supabase } from '../../../api/supabaseClient';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('src/__tests__/auto/api/admin', () => {
  it('listTenants devuelve datos cuando hay resultados', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        order: () => Promise.resolve({ data: [{ id: 't1', name: 'Colegio' }], error: null }),
      }),
    }));

    const res = await admin.listTenants();
    expect(res).toBeInstanceOf(Array);
    expect(res[0]).toHaveProperty('id', 't1');
  });

  it('listTenants lanza cuando supabase devuelve error', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        order: () => Promise.resolve({ data: null, error: new Error('query failed') }),
      }),
    }));

    await expect(admin.listTenants()).rejects.toThrow('query failed');
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

  it('createStudent lanza cuando supabase devuelve error', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('insert failed') }),
        }),
      }),
    }));

    await expect(admin.createStudent('tenant1', { first_name: 'Juan' })).rejects.toThrow('insert failed');
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

  it('importStudents lanza cuando insert falla', async () => {
    const records = [{ first_name: 'Ana' }];
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      insert: (_recs: any) => ({
        select: () => Promise.resolve({ data: null, error: new Error('insert bulk failed') }),
      }),
    }));

    await expect(admin.importStudents('t1', records as any)).rejects.toThrow('insert bulk failed');
  });

  it('deleteStudent borra sin error cuando OK', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }));

    await expect(admin.deleteStudent('stu1')).resolves.toBeUndefined();
  });

  it('deleteStudent lanza cuando supabase devuelve error', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      delete: () => ({
        eq: () => Promise.resolve({ error: new Error('delete student failed') }),
      }),
    }));

    await expect(admin.deleteStudent('stu1')).rejects.toThrow('delete student failed');
  });

  it('updateStudent actualiza y devuelve la fila', async () => {
    const updated = { id: 'stu1', first_name: 'Pablo', last_name: 'Lopez' };
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: updated, error: null }),
          }),
        }),
      }),
    }));

    const res = await admin.updateStudent('stu1', { first_name: 'Pablo' });
    expect(res).toEqual(updated);
  });

  it('updateStudent lanza cuando supabase devuelve error', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('update failed') }),
          }),
        }),
      }),
    }));

    await expect(admin.updateStudent('stu1', { first_name: 'X' })).rejects.toThrow('update failed');
  });

  it('deleteTenantSetting borra sin error cuando OK', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }));

    await expect(admin.deleteTenantSetting('s1')).resolves.toBeUndefined();
  });

  it('deleteTenantSetting lanza cuando supabase devuelve error', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      delete: () => ({
        eq: () => Promise.resolve({ error: new Error('delete failed') }),
      }),
    }));

    await expect(admin.deleteTenantSetting('s1')).rejects.toThrow('delete failed');
  });
});
