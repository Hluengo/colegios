import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseClientFullMock } from '../test/supabaseMock';

// Mock withRetry to simply invoke the passed function
vi.mock('./withRetry', () => ({
  withRetry: (fn: any) => fn(),
}));


// Mock logger to avoid noisy console formatting during invalid Zod errors
vi.mock('../utils/logger', () => ({
  logger: { debug: () => {}, error: () => {}, warn: () => {} },
  default: { debug: () => {}, error: () => {}, warn: () => {} },
}));

// Mock evidence helpers used by getCaseFollowups
vi.mock('./evidence', () => ({
  getEvidenceSignedUrl: vi.fn().mockResolvedValue('https://signed.example/file'),
  getEvidencePublicUrl: vi.fn().mockReturnValue('https://public.example/file'),
}));

// Mock supabase with all required exports
vi.mock('./supabaseClient', () => supabaseClientFullMock);

import * as db from './db';
import { supabase } from './supabaseClient';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('src/api/db (smoke & pure helpers)', () => {
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

  // sanitizeSearchQuery is internal; skip direct test

  it('getResponsables devuelve lista única cuando withRetry retorna datos', async () => {
    // preparar supabase.from(...).select().not().neq().order() -> Promise<{data, error}>
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        not: () => ({
          neq: () => ({
            order: () => Promise.resolve({ data: [{ responsible: 'A' }, { responsible: 'A' }, { responsible: '' }], error: null }),
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
    // Primero mock para búsqueda de students (sin q -> no se usa)
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        order: () => ({
          range: () => Promise.resolve({ data: [{ id: 'c1', tenant_id: 't1' }], error: null, count: 1 }),
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

  it('startSeguimiento crea followup y retorna true cuando no existe followup', async () => {
    // mock obtener tenant del caso (select().eq().single())
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { tenant_id: 't1' }, error: null }),
        }),
      }),
    }));

    // mock rpc start_due_process
    (supabase.rpc as unknown as any).mockResolvedValueOnce({ error: null });

    // mock check followups -> empty (select().eq().limit())
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }));

    // mock insert followup
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      insert: () => Promise.resolve({ error: null }),
    }));

    const res = await db.startSeguimiento('case-1');
    expect(res).toBe(true);
  });

  it('getCaseFollowups adjunta urls firmadas y devuelve estructura', async () => {
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({
            data: [
              {
                id: 'f1',
                case_id: 'case-1',
                followup_evidence: [
                  { id: 'e1', storage_path: 'p1', file_name: 'a.pdf', content_type: 'application/pdf', file_size: 100, created_at: '2020-01-01' },
                ],
              },
            ],
            error: null,
          }),
        }),
      }),
    }));

    const rows = await db.getCaseFollowups('case-1');
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0]).toHaveProperty('evidence_files');
    expect(rows[0].evidence_files[0]).toHaveProperty('url');
  });

  it('getCase lanza si id vacio', async () => {
    await expect(db.getCase('', {} as any)).rejects.toThrow('Se requiere id de caso');
  });

  it('createCase lanza en validacion inválida', async () => {
    await expect(db.createCase({} as any)).rejects.toThrow('Datos inválidos para crear caso');
  });
});
