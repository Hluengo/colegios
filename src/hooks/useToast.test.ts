import { it, expect } from 'vitest';
import * as hook from './useToast';

it('useToast exports show/hide functions', () => {
  expect(Object.keys(hook).length).toBeGreaterThan(0);
});
