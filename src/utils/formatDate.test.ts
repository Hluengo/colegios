import { it, expect } from 'vitest';
import { formatDate } from './formatDate';

it('formatDate returns string for valid date', () => {
  const s = formatDate(new Date('2020-01-02'));
  expect(typeof s).toBe('string');
});
