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

  // TODO: Fix this test - inline mocks don't work well with vitest hoisting
  // it('startSeguimiento lanza si rpc devuelve error', async () => {
  //   const { startSeguimiento } = await import('../db');
  //   await expect(startSeguimiento('c1')).rejects.toBeDefined();
  // });
});
