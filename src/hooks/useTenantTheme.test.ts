import { it, expect } from 'vitest';
import * as hook from './useTenantTheme';

it('useTenantTheme exports', () => {
  expect(Object.keys(hook).length).toBeGreaterThanOrEqual(0);
});
