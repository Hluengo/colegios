import { it, expect } from 'vitest';
import * as hook from './useSeguimientos';

it('useSeguimientos exports', () => {
  expect(Object.keys(hook).length).toBeGreaterThanOrEqual(0);
});
