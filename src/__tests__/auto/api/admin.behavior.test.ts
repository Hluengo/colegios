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

describe('src/__tests__/auto/api/admin (behavior – mocked supabase)', () => {
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

  it('updateTenantBranding lanza cuando supabase devuelve error', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('update failed') }),
          }),
        }),
      }),
    }));

    await expect(admin.updateTenantBranding('t1', { name: 'X' })).rejects.toThrow('update failed');
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

  it('listTenantSettings devuelve lista vacía por defecto', async () => {
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

  it('inviteTenantUser usa auth.signUp y devuelve user', async () => {
    (supabase.auth.signUp as unknown as any).mockResolvedValueOnce({
      data: { user: { id: 'u1' } },
      error: null,
    });
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }));

    const user = await admin.inviteTenantUser('t1', { email: 'a@b.c' });
    expect(user).toHaveProperty('id', 'u1');
  });

  it('inviteTenantUser lanza si signUp falla', async () => {
    (supabase.auth.signUp as unknown as any).mockResolvedValueOnce({
      data: { user: null },
      error: new Error('signup failed'),
    });

    await expect(admin.inviteTenantUser('t1', { email: 'a@b.c' })).rejects.toThrow('signup failed');
  });

  it('listAuditLogs devuelve filas cuando hay datos', async () => {
    const rows = [{ id: 'log1', action: 'INSERT' }];
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }));

    const res = await admin.listAuditLogs('t1');
    expect(res).toBeInstanceOf(Array);
    expect(res[0]).toHaveProperty('id', 'log1');
  });

  it('listAuditLogs lanza cuando supabase devuelve error', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: null, error: new Error('logs failed') }),
          }),
        }),
      }),
    }));

    await expect(admin.listAuditLogs('t1')).rejects.toThrow('logs failed');
  });

  it('switchPlatformTenant llama rpc y devuelve data', async () => {
    (supabase.rpc as unknown as any).mockResolvedValueOnce({ data: { ok: true }, error: null });

    const res = await admin.switchPlatformTenant('t1');
    expect(res).toEqual({ ok: true });
  });

  it('switchPlatformTenant lanza cuando rpc devuelve error', async () => {
    (supabase.rpc as unknown as any).mockResolvedValueOnce({ data: null, error: new Error('rpc failed') });

    await expect(admin.switchPlatformTenant('t1')).rejects.toThrow('rpc failed');
  });
});
