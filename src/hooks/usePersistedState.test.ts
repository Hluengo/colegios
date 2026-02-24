import { it, expect } from 'vitest';
import * as hook from './usePersistedState';

it('usePersistedState exports hook', () => {
  expect(Object.keys(hook).length).toBeGreaterThan(0);
});
