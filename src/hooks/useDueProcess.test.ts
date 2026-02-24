import { it, expect } from 'vitest';
import * as hook from './useDueProcess';

it('useDueProcess module loads', () => {
  expect(Object.keys(hook).length).toBeGreaterThan(0);
});
