import { it, expect } from 'vitest';
import * as qc from './queryClient';

it('queryClient exports client or functions', () => {
  expect(Object.keys(qc).length).toBeGreaterThan(0);
});
