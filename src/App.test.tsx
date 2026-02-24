import { it, expect } from 'vitest';
import * as AppMod from './App';

it('App exports a default component', () => {
  expect(AppMod.default).toBeDefined();
});
