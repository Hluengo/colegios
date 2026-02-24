import { describe, it, expect } from 'vitest';
import * as db from './../../../api/db';

describe('db - basic unit checks', () => {
  it('exports helpers', () => {
    expect(db.buildCaseInsert).toBeTypeOf('function');
    expect(db.buildCaseUpdate).toBeTypeOf('function');
    expect(db.mapCaseRow).toBeTypeOf('function');
    expect(db.mapFollowupRow).toBeTypeOf('function');
  });

  it('buildCaseInsert applies defaults and respects provided values', () => {
    const payload = { student_id: 's1', incident_date: '2026-02-24', course_incident: '1A', conduct_type: 'Leve' };
    const res = db.buildCaseInsert(payload as any);
    expect(res).toMatchObject({ student_id: 's1', incident_date: '2026-02-24', course_incident: '1A', conduct_type: 'Leve', status: 'Reportado' });
  });

  it('buildCaseUpdate includes only defined fields', () => {
    const upd = db.buildCaseUpdate({ status: 'Cerrado', short_description: undefined } as any);
    expect(upd).toHaveProperty('status', 'Cerrado');
    expect(upd).not.toHaveProperty('short_description');
  });

  it('mapCaseRow nullifies student when tenant mismatch', () => {
    const row = { id: 'c1', tenant_id: 'tA', students: { id: 's1', tenant_id: 'tB' } } as any;
    const mapped = db.mapCaseRow(row);
    expect(mapped.students).toBeNull();
  });

  it('mapFollowupRow returns expected shape', () => {
    const row = { id: 'f1', case_id: 'c1', action_date: '2026-02-24', created_at: '2026-02-24T00:00:00Z', action_type: 'Monitoreo', process_stage: '1', detail: 'x', responsible: 'sys', observations: '', due_date: null, description: null } as any;
    const out = db.mapFollowupRow(row);
    expect(out).toMatchObject({ id: 'f1', case_id: 'c1', action_type: 'Monitoreo' });
  });
});
