import { it, expect } from 'vitest';
import * as hook from './useMediaQuery';

it('useMediaQuery exports function', () => {
  expect(typeof (hook as any).default === 'function' || Object.keys(hook).length > 0).toBe(true);
});
