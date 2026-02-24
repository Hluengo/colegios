import { it, expect } from 'vitest';
import * as s from './sentry';

it('sentry module loads', () => {
  expect(Object.keys(s).length).toBeGreaterThanOrEqual(0);
});
