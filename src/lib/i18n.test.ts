import { it, expect } from 'vitest';
import * as i18n from './i18n';

it('i18n module exports config', () => {
  expect(Object.keys(i18n).length).toBeGreaterThan(0);
});
