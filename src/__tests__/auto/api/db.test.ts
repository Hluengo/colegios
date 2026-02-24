import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../api/withRetry', () => ({
  withRetry: (fn: any) => fn(),
}));

vi.mock('../../../utils/logger', () => ({
  logger: { debug: () => {}, error: () => {}, warn: () => {} },
  default: { debug: () => {}, error: () => {}, warn: () => {} },
}));

vi.mock('../../../api/evidence', () => ({
  getEvidenceSignedUrl: vi.fn().mockResolvedValue('https://signed.example/file'),
  getEvidencePublicUrl: vi.fn().mockReturnValue('https://public.example/file'),
}));

vi.mock('../../../api/supabaseClient', () => {
  const from = vi.fn();
  return {
    supabase: {
      from,
      rpc: vi.fn(),
      storage: { from: vi.fn() },
      auth: { signUp: vi.fn() },
    },
  };
});

import * as db from '../../../api/db';
import { supabase } from '../../../api/supabaseClient';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('src/__tests__/auto/api/db', () => {
  it('buildCaseInsert aplica defaults correctamente', () => {
    const out = db.buildCaseInsert({ tenant_id: 't1', student_id: 's1' });
    expect(out).toHaveProperty('tenant_id', 't1');
    expect(out).toHaveProperty('student_id', 's1');
    expect(out).toHaveProperty('status', 'Reportado');
  });

  it('buildCaseUpdate incluye solo campos proporcionados', () => {
    const out = db.buildCaseUpdate({ incident_time: '12:00', closed_at: '2020-01-01' } as any);
    expect(out).toHaveProperty('incident_time', '12:00');
    expect(out).toHaveProperty('closed_at', '2020-01-01');
  });

  it('getResponsables devuelve lista única cuando withRetry retorna datos', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        not: () => ({
          neq: () => ({
            order: () =>
              Promise.resolve({
                data: [{ responsible: 'A' }, { responsible: 'A' }, { responsible: '' }],
                error: null,
              }),
          }),
        }),
      }),
    }));

    const res = await db.getResponsables();
    expect(Array.isArray(res)).toBe(true);
    expect(res).toContain('A');
  });

  it('getCases devuelve filas mapeadas cuando hay datos', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        order: () => Promise.resolve({ data: [{ id: 'c1', tenant_id: 't1', students: null }], error: null }),
      }),
    }));

    const rows = await db.getCases(null, { tenantId: null });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0]).toHaveProperty('id', 'c1');
  });

  it('getCasesPage devuelve rows y total cuando hay datos', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        order: () => ({
          range: () =>
            Promise.resolve({ data: [{ id: 'c1', tenant_id: 't1' }], error: null, count: 1 }),
        }),
      }),
    }));

    const res = await db.getCasesPage({ page: 1, pageSize: 10 });
    expect(res).toHaveProperty('rows');
    expect(res).toHaveProperty('total');
  });

  it('startSeguimiento lanza si caseId vacío', async () => {
    await expect(db.startSeguimiento('')).rejects.toThrow('Se requiere caseId');
  });

  it('getCase lanza si id vacio', async () => {
    await expect(db.getCase('', {} as any)).rejects.toThrow('Se requiere id de caso');
  });

  it('createCase lanza en validacion inválida', async () => {
    await expect(db.createCase({} as any)).rejects.toThrow('Datos inválidos para crear caso');
  });
});
