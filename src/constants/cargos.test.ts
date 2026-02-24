import { it, expect } from 'vitest';
import { CARGOS } from './cargos';

it('cargos exports array of strings', () => {
  expect(Array.isArray(CARGOS)).toBe(true);
  expect(CARGOS.length).toBeGreaterThan(0);
  expect(typeof CARGOS[0]).toBe('string');
});
