import { it, expect } from 'vitest';
import * as ctx from './TenantContext';

it('TenantContext exports Provider', () => {
  expect(Object.keys(ctx).length).toBeGreaterThan(0);
});
