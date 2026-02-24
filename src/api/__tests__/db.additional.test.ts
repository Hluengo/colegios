import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../withRetry', () => ({ withRetry: (fn: any) => fn() }));
vi.mock('../utils/logger', () => ({ warn: () => undefined, error: () => undefined, debug: () => undefined }));

describe('db additional branches', () => {
  beforeEach(() => vi.resetModules());

  it('getCasesByIdsLite devuelve [] cuando ids vacíos', async () => {
    const { getCasesByIdsLite } = await import('../db');
    const res = await getCasesByIdsLite([]);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });

  it('getCasesByStatus devuelve [] cuando status vacío', async () => {
    const { getCasesByStatus } = await import('../db');
    const res = await getCasesByStatus('', {});
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });

  // TODO: Fix this test - inline mocks don't work well with vitest hoisting
  // it('sanitizeSearchQuery elimina caracteres peligrosos', async () => {
  //   const { getCasesPage } = await import('../db');
  //   const res = await getCasesPage({ search: '%(drop), name' });
  //   expect(res).toHaveProperty('rows');
  //   expect(Array.isArray(res.rows)).toBe(true);
  // });
});
