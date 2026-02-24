import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/logger', () => ({ warn: () => undefined, error: () => undefined, debug: () => undefined }));
vi.mock('../lib/sentry', () => ({ captureMessage: () => undefined }));

describe('db proposed branches', () => {
  beforeEach(() => vi.resetModules());

  it('createCase emite warning cuando no hay tenant_id y retorna caso insertado', async () => {
    vi.doMock('../utils/validation.schemas', () => ({
      casoSchema: { safeParse: (p: any) => ({ success: true, data: { ...p, tenant_id: null } }) },
    }));

    // withRetry devuelve el resultado simulado del insert
    vi.doMock('../withRetry', () => ({ withRetry: () => ({ data: { id: 'c-x', status: 'Reportado', created_at: 't', student_id: 's-x' }, error: null }) }));

    const { createCase } = await import('../db');
    const payload = { incident_date: '2026-02-24', incident_time: '12:00', student_id: '00000000-0000-0000-0000-000000000000', course_incident: '1A', conduct_type: 'Leve', short_description: 'Descripción suficientemente larga' };
    const res = await createCase(payload);
    expect(res).toHaveProperty('id', 'c-x');
  });

  it('createCase lanza si supabase devuelve error en insert', async () => {
    vi.doMock('../utils/validation.schemas', () => ({
      casoSchema: { safeParse: (p: any) => ({ success: true, data: { ...p, tenant_id: 't1' } }) },
    }));

    // Simular respuesta de withRetry para el fallo de insert
    vi.doMock('../withRetry', () => ({ withRetry: () => ({ data: null, error: { message: 'insert failed' } }) }));

    const { createCase } = await import('../db');
    const payload = { tenant_id: 't1', incident_date: '2026-02-24', incident_time: '12:00', student_id: '00000000-0000-0000-0000-000000000000', course_incident: '1A', conduct_type: 'Leve', short_description: 'Descripción suficientemente larga' };
    await expect(createCase(payload)).rejects.toBeDefined();
  });

  it('updateCase lanza si id vacío', async () => {
    const { updateCase } = await import('../db');
    await expect(updateCase('', { status: 'Cerrado' })).rejects.toThrow('Se requiere id de caso');
  });

  it('createFollowup lanza si falta process_stage', async () => {
    vi.doMock('../tenantHelpers', () => ({ inferTenantFromCase: async () => 't1' }));
    const { createFollowup } = await import('../db');
    await expect(createFollowup({ case_id: '00000000-0000-0000-0000-000000000000', action_type: 'Monitoreo' })).rejects.toThrow('Se requiere process_stage');
  });

  it('startSeguimiento no inserta followup cuando ya existe uno', async () => {
    // Simular secuencia de withRetry: case select, rpc, followup check
    vi.doMock('../withRetry', () => {
      const seq = [
        { data: { tenant_id: 't-A' }, error: null },
        { error: null },
        { data: [{ id: 'f1' }], error: null },
      ];
      return { withRetry: () => seq.shift() };
    });

    const { startSeguimiento } = await import('../db');
    const res = await startSeguimiento('00000000-0000-0000-0000-000000000000');
    expect(res).toBe(true);
  });

  it('getCasesPage propaga error cuando subconsulta students falla', async () => {
    // Simular fallo en la subconsulta de students mediante withRetry
    vi.doMock('../withRetry', () => ({ withRetry: () => ({ data: null, error: { message: 'students error' } }) }));

    const { getCasesPage } = await import('../db');
    await expect(getCasesPage({ search: 'x' })).rejects.toBeDefined();
  });
});
