import { it, expect } from 'vitest';
import { BRANDING } from './branding';

it('branding exports defaults', () => {
  expect(BRANDING).toBeDefined();
  expect(typeof BRANDING.appName).toBe('string');
  expect(typeof BRANDING.logoApp).toBe('string');
});
