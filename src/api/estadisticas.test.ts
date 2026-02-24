import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseClientFullMock } from '../test/supabaseMock';

// Mock logger to avoid noise
vi.mock('../utils/logger', () => ({ logger: { debug: () => {}, warn: () => {}, error: () => {} } }));

// Mock withRetry to invoke directly
vi.mock('./withRetry', () => ({ withRetry: (fn: any) => fn() }));

// Mock supabase client with all required exports
vi.mock('./supabaseClient', () => supabaseClientFullMock);

import * as stats from './estadisticas';
import { supabase } from './supabaseClient';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('src/api/estadisticas', () => {
  it('getFechasFromAnioSemestre funciona correctamente', () => {
    expect(typeof (stats as any).getFechasFromAnioSemestre).toBe('function');
    const r = (stats as any).getFechasFromAnioSemestre(2020, '1');
    expect(r).toEqual({ desde: '2020-01-01', hasta: '2020-06-30' });
  });

  it('loadEstadisticas retorna defaults cuando fechas vacías', async () => {
    const out = await stats.loadEstadisticas({ desde: null, hasta: null });
    expect(out).toHaveProperty('kpis');
    expect(out.kpis.casos_total).toBe(0);
  });

  it('loadEstadisticas procesa resultados de RPC y cases', async () => {
    // preparar rpc mocks en el mismo orden que el array en el código
    const simpleRow = [{ casos_total: 2 }];
    (supabase.rpc as unknown as any)
      .mockResolvedValueOnce({ data: simpleRow, error: null }) // stats_kpis
      .mockResolvedValueOnce({ data: [{ total_plazos: 1 }], error: null }) // stats_cumplimiento_plazos
      .mockResolvedValueOnce({ data: [{ estudiantes_reincidentes: 0 }], error: null })
      .mockResolvedValueOnce({ data: [{ responsable: 'X', total: 1 }], error: null })
      .mockResolvedValueOnce({ data: [{ level: 'Y', total: 1 }], error: null })
      .mockResolvedValueOnce({ data: [{ promedio: 0 }], error: null })
      .mockResolvedValueOnce({ data: [{ promedio_dias: 0 }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    // mock cases query used for building reincidentes
    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        gte: () => ({
          lte: () => Promise.resolve({ data: [{ student_id: 's1', students: { first_name: 'A', last_name: 'B' } }], error: null }),
        }),
      }),
    }));

    const out = await stats.loadEstadisticas({ desde: '2020-01-01', hasta: '2020-12-31' });
    expect(out).toHaveProperty('kpis');
    expect(out).toHaveProperty('charts');
  });

  it('loadEstadisticas lanza si un RPC devuelve error', async () => {
    (supabase.rpc as unknown as any).mockResolvedValueOnce({ data: null, error: { message: 'rpc fail' } });
    await expect(stats.loadEstadisticas({ desde: '2020-01-01', hasta: '2020-12-31' })).rejects.toThrow();
  });

  it('loadEstadisticas detecta reincidentes cuando hay múltiples casos por estudiante', async () => {
    (supabase.rpc as unknown as any)
      .mockResolvedValueOnce({ data: [{ casos_total: 2 }], error: null })
      .mockResolvedValueOnce({ data: [{ total_plazos: 1 }], error: null })
      .mockResolvedValueOnce({ data: [{ estudiantes_reincidentes: 2 }], error: null })
      .mockResolvedValueOnce({ data: [{ responsable: 'X', total: 1 }], error: null })
      .mockResolvedValueOnce({ data: [{ level: 'Y', total: 1 }], error: null })
      .mockResolvedValueOnce({ data: [{ promedio: 0 }], error: null })
      .mockResolvedValueOnce({ data: [{ promedio_dias: 0 }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    (supabase.from as unknown as any).mockImplementationOnce(() => ({
      select: () => ({
        gte: () => ({
          lte: () => Promise.resolve({
            data: [
              { student_id: 's1', students: { first_name: 'A', last_name: 'B' } },
              { student_id: 's1', students: { first_name: 'A', last_name: 'B' } },
            ],
            error: null,
          }),
        }),
      }),
    }));

    const out = await stats.loadEstadisticas({ desde: '2020-01-01', hasta: '2020-12-31' });
    expect(Array.isArray(out.reincidentes)).toBe(true);
    expect(out.reincidentes.length).toBeGreaterThanOrEqual(1);
  });

  it('loadEstadisticas continúa cuando la consulta de casos falla', async () => {
    (supabase.rpc as unknown as any).mockResolvedValue({ data: [], error: null });
    (supabase.from as unknown as any).mockImplementationOnce(() => {
      throw new Error('db fail');
    });

    const out = await stats.loadEstadisticas({ desde: '2020-01-01', hasta: '2020-12-31' });
    expect(out).toHaveProperty('kpis');
    expect(Array.isArray(out.reincidentes)).toBe(true);
  });
});
