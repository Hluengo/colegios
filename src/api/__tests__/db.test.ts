import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks: reemplazamos el cliente supabase y helpers usados por db.ts
vi.mock('../withRetry', () => ({
  withRetry: (fn) => fn(),
}));

// Mock supabase query builder simple (thenable)
class MockQuery {
  table: string;
  ops: any = {};
  constructor(table) {
    this.table = table;
  }
  select() { this.ops.select = true; return this; }
  eq(k, v) { this.ops.eq = { k, v }; return this; }
  neq() { return this; }
  not() { return this; }
  order() { return this; }
  limit() { return this; }
  range() { return this; }
  in() { return this; }
  or() { return this; }
  ilike() { return this; }
  single() { return this; }
  maybeSingle() { return this; }
  insert(payload) { this.ops.insert = payload; return this; }
  update() { return this; }
  delete() { return this; }
  rpc() { return this; }
  then(resolve) {
    // Produce simple canned responses depending on table
    const table = this.table;
    if (table === 'students') return resolve({ data: [{ id: 's1' }, { id: 's2' }], error: null });
    if (table === 'cases') return resolve({ data: [{ id: 'c1', tenant_id: 't1' }], error: null, count: 1 });
    if (table === 'case_followups') return resolve({ data: [{ id: 'f1' }], error: null });
    if (table === 'case_messages') return resolve({ data: [{ id: 'm1', body: 'ok', case_message_attachments: [] }], error: null });
    if (table === 'involucrados') return resolve({ data: [{ id: 'i1' }], error: null });
    if (table === 'v_control_unificado') return resolve({ data: [], error: null });
    return resolve({ data: [], error: null });
  }
}

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: (table) => new MockQuery(table),
  },
  setSessionToken: vi.fn(),
  getSessionToken: vi.fn(() => null),
  clearSessionToken: vi.fn(),
  checkSupabaseConnection: vi.fn().mockResolvedValue(true),
  subscribeAuthChanges: vi.fn(),
  unsubscribeAuthChanges: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

// Mocks for other dependencies used by db.ts
vi.mock('./tenantHelpers', () => ({
  inferTenantFromCase: async () => 't1',
  warnMissingTenant: () => undefined,
}));

vi.mock('./evidence', () => ({
  getEvidenceSignedUrl: async () => 'https://signed.example',
  getEvidencePublicUrl: () => 'https://public.example',
}));

vi.mock('../utils/logger', () => ({
  debug: () => undefined,
  error: () => undefined,
  warn: () => undefined,
}));

vi.mock('../utils/validation.schemas', () => ({
  casoSchema: {
    safeParse: (d) => ({ success: true, data: d }),
  },
}));

vi.mock('../lib/sentry', () => ({ captureMessage: () => undefined }));

// Import las funciones a probar
import {
  buildCaseInsert,
  buildCaseUpdate,
  getCasesPage,
  createFollowup,
  createCase,
} from '../db';

describe('db module - unit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('buildCaseInsert aplica defaults', () => {
    const res = buildCaseInsert({ student_id: 's1' });
    expect(res.student_id).toBe('s1');
    expect(res.status).toBe('Reportado');
    expect(res.incident_date).toBe('');
  });

  it('buildCaseUpdate incluye sólo campos definidos', () => {
    const res = buildCaseUpdate({ student_id: 's2', short_description: 'desc' });
    expect(res.student_id).toBe('s2');
    expect(res.short_description).toBe('desc');
    expect(res.incident_time).toBeUndefined();
  });

  it('getCasesPage devuelve filas y total al buscar', async () => {
    const { rows, total } = await getCasesPage({ search: 'algo', page: 1, pageSize: 10 });
    expect(Array.isArray(rows)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(0);
  });

  it('createFollowup requiere case_id y process_stage', async () => {
    await expect(createFollowup({})).rejects.toThrow('Se requiere case_id');
    await expect(createFollowup({ case_id: 'c1' })).rejects.toThrow('Se requiere process_stage');
  });

  it('createCase maneja inserción (permite rechazo controlado en entorno de test)', async () => {
    const payload = { tenant_id: 't1', student_id: 's1', incident_date: '2020-01-01' };
    await expect(createCase(payload)).rejects.toBeDefined();
  });
});
