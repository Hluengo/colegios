import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: (table) => ({
      select: () => ({ then: (resolve) => resolve({ data: [], error: null }) }),
      maybeSingle: () => ({ then: (resolve) => resolve({ data: null, error: null }) }),
    }),
    rpc: async () => ({ data: null, error: null }),
  },
  setSessionToken: vi.fn(),
  getSessionToken: vi.fn(() => null),
  clearSessionToken: vi.fn(),
  checkSupabaseConnection: vi.fn().mockResolvedValue(true),
  subscribeAuthChanges: vi.fn(),
  unsubscribeAuthChanges: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('./tenantHelpers', () => ({
  inferTenantFromCase: async () => {
    throw new Error('No encontrado');
  },
  warnMissingTenant: vi.fn(),
}));

vi.mock('../lib/sentry', () => ({ captureMessage: vi.fn() }));

import { getPlazosResumenMany, getControlPlazos } from '../db';

describe('db branches', () => {
  beforeEach(() => vi.resetModules());

  it('getPlazosResumenMany returns empty Map for empty input', async () => {
    const m = await getPlazosResumenMany([]);
    expect(m instanceof Map).toBe(true);
    expect(m.size).toBe(0);
  });

  it('getControlPlazos returns empty array for missing caseId', async () => {
    const r = await getControlPlazos(undefined as any);
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(0);
  });
});
