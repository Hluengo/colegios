import { describe, it, expect, vi, beforeEach } from 'vitest';

// Reuse withRetry mock behaviour
vi.mock('../withRetry', () => ({ withRetry: (fn) => fn() }));

// We'll provide a custom supabase mock per test via resetModules

vi.mock('../utils/logger', () => ({ debug: () => undefined, warn: () => undefined, error: () => undefined }));

describe('db extra branches', () => {
  beforeEach(() => vi.resetModules());

  it('mapCaseRow convierte students a null cuando tenant mismatch', async () => {
    const { mapCaseRow } = await import('../db');
    const row = { id: 'c1', tenant_id: 't-A', students: { id: 's1', tenant_id: 't-B' } };
    const mapped = mapCaseRow(row);
    expect(mapped.students).toBeNull();
  });

  it('startSeguimiento lanza si rpc devuelve error', async () => {
    // Mock supabase for this test only
    vi.mock('./supabaseClient', () => ({
      supabase: {
        from: (table) => ({
          select: () => ({ single: () => ({ then: (resolve) => resolve({ data: { tenant_id: 't1' }, error: null }) }) }),
          insert: () => ({ then: (resolve) => resolve({ data: [], error: null }) }),
        }),
        rpc: () => ({ then: (resolve) => resolve({ error: { message: 'rpc failed' } }) }),
      },
    }));

    const { startSeguimiento } = await import('../db');
    await expect(startSeguimiento('c1')).rejects.toBeDefined();
  });
});
