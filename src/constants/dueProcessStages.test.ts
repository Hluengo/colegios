import { it, expect } from 'vitest';
import { DUE_PROCESS_STAGES } from './dueProcessStages';

it('due process stages is an array with steps', () => {
  expect(Array.isArray(DUE_PROCESS_STAGES)).toBe(true);
  expect(DUE_PROCESS_STAGES.length).toBeGreaterThan(3);
});
