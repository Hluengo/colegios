import { it, expect } from 'vitest';
import * as hook from './useAccessibility';

it('useAccessibility module loads', () => {
  expect(Object.keys(hook).length).toBeGreaterThan(0);
});
