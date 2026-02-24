import { describe, expect, it } from 'vitest';
import { getStudentName } from './studentName';

describe('getStudentName', () => {
  it('returns fallback for null/undefined and empty strings', () => {
    expect(getStudentName(null)).toBe('N/A');
    expect(getStudentName(undefined, 'Sin nombre')).toBe('Sin nombre');
    expect(getStudentName('')).toBe('N/A');
  });

  it('returns plain string values as-is', () => {
    expect(getStudentName('Juan Perez')).toBe('Juan Perez');
  });

  it('prefers explicit object name field', () => {
    const value = { name: 'Nombre Principal', first_name: 'Juan', last_name: 'Perez' };
    expect(getStudentName(value)).toBe('Nombre Principal');
  });

  it('builds full name from common first/last variants', () => {
    expect(getStudentName({ first_name: 'Juan', last_name: 'Perez' })).toBe('Juan Perez');
    expect(getStudentName({ Nombre: 'Ana', Apellido: 'Diaz' })).toBe('Ana Diaz');
  });

  it('uses combined fallback name fields when present', () => {
    expect(getStudentName({ fullName: 'Maria Lopez' })).toBe('Maria Lopez');
    expect(getStudentName({ full_name: 'Pablo Soto' })).toBe('Pablo Soto');
    expect(getStudentName({ displayName: 'Camila Ruiz' })).toBe('Camila Ruiz');
  });

  it('stringifies other primitive values', () => {
    expect(getStudentName(12345)).toBe('12345');
    expect(getStudentName(true)).toBe('true');
  });
});
