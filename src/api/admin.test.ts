import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseClientFullMock } from '../test/supabaseMock';

// Mockar el cliente de supabase usado por el módulo
vi.mock('./supabaseClient', () => supabaseClientFullMock);

  it('updateTenantBranding actualiza y devuelve datos', async () => {
    const updated = { id: 't1', name: 'Nuevo' };
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: updated, error: null }),
          }),
        }),
      }),
    }));

    const res = await admin.updateTenantBranding('t1', { name: 'Nuevo' });
    expect(res).toEqual(updated);
  });

  it('uploadTenantBrandAsset retorna url cuando upload OK', async () => {
    const fakeFile = { name: 'logo.png', type: 'image/png' } as any;
    (supabase.storage.from as unknown as any).mockImplementation(() => ({
      upload: (_path: string, _file: any, _opts: any) => Promise.resolve({ error: null }),
      getPublicUrl: (p: string) => ({ data: { publicUrl: `https://cdn/${p}` } }),
    }));

    const res = await admin.uploadTenantBrandAsset('t1', fakeFile, 'logo');
    expect(res).toHaveProperty('bucket', 'branding');
    expect(res).toHaveProperty('url');
  });

  it('uploadTenantBrandAsset lanza si no hay publicUrl', async () => {
    const fakeFile = { name: 'logo.png', type: 'image/png' } as any;
    (supabase.storage.from as unknown as any).mockImplementation(() => ({
      upload: () => Promise.resolve({ error: null }),
      getPublicUrl: () => ({ data: {} }),
    }));

    await expect(admin.uploadTenantBrandAsset('t1', fakeFile, 'logo')).rejects.toThrow(
      'No se pudo obtener URL pública del archivo',
    );
  });

  it('uploadTenantBrandAsset lanza cuando upload falla', async () => {
    const fakeFile = { name: 'logo.png', type: 'image/png' } as any;
    (supabase.storage.from as unknown as any).mockImplementationOnce(() => ({
      upload: () => Promise.resolve({ error: new Error('upload failed') }),
    }));

    await expect(admin.uploadTenantBrandAsset('t1', fakeFile, 'logo')).rejects.toThrow('upload failed');
  });

  it('listTenantSettings devuelve lista (vacía por defecto)', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }));

    const res = await admin.listTenantSettings('t1');
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });

  it('upsertTenantSetting upserta y devuelve fila', async () => {
    const row = { id: 's1', setting_key: 'k', setting_value: 'v' };
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      upsert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: row, error: null }),
        }),
      }),
    }));

    const res = await admin.upsertTenantSetting('t1', 'k', 'v');
    expect(res).toEqual(row);
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

  it('createStudent lanza cuando supabase devuelve error', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('insert failed') }),
        }),
      }),
    }));

    await expect(admin.createStudent('tenant1', { first_name: 'Juan' } as any)).rejects.toThrow('insert failed');
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

    const res = await admin.updateStudent('stu1', { first_name: 'Pablo' } as any);
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

    await expect(admin.updateStudent('stu1', { first_name: 'X' } as any)).rejects.toThrow('update failed');
  });
});
