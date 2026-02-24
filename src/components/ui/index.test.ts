import { it, expect } from 'vitest';
import * as ui from './index';

it('ui index exports some components', () => {
  expect(typeof ui.Button !== 'undefined' || typeof ui.Modal !== 'undefined').toBe(true);
});
