import { it, expect } from 'vitest';
import logger from './logger';

it('logger exports methods', () => {
  expect(typeof (logger as any).info === 'function').toBe(true);
});
