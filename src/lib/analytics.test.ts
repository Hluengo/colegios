import { it, expect } from 'vitest';
import * as analytics from './analytics';

it('analytics exports sendEvent (or similar)', () => {
  expect(Object.keys(analytics).length).toBeGreaterThan(0);
});
