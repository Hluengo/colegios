import { describe, expect, it } from 'vitest';
import { getCaseStatus, getCaseStatusLabel } from './caseStatus';

describe('caseStatus', () => {
  it('normalizes status as lowercase trimmed text', () => {
    expect(getCaseStatus({ status: '  En Seguimiento  ' })).toBe('en seguimiento');
  });

  it('uses fallback when status is missing', () => {
    expect(getCaseStatus({}, ' Pendiente ')).toBe('pendiente');
  });

  it('maps known statuses to canonical labels', () => {
    expect(getCaseStatusLabel({ status: 'en seguimiento' })).toBe('En seguimiento');
    expect(getCaseStatusLabel({ status: 'CERRADO' })).toBe('Cerrado');
  });

  it('title-cases unknown statuses', () => {
    expect(getCaseStatusLabel({ status: 'muy GRAVE' })).toBe('Muy Grave');
  });

  it('returns default or custom fallback label when status is empty', () => {
    expect(getCaseStatusLabel({})).toBe('Reportado');
    expect(getCaseStatusLabel({}, 'Sin estado')).toBe('Sin estado');
  });
});
