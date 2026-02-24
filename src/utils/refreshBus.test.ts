import { describe, expect, it, vi } from 'vitest';
import { emitDataUpdated, onDataUpdated } from './refreshBus';

describe('refreshBus', () => {
  it('notifies subscribers when data-updated is emitted', () => {
    const handler = vi.fn();
    const off = onDataUpdated(handler);

    emitDataUpdated();
    expect(handler).toHaveBeenCalledTimes(1);

    off();
  });

  it('unsubscribes correctly', () => {
    const handler = vi.fn();
    const off = onDataUpdated(handler);
    off();

    emitDataUpdated();
    expect(handler).not.toHaveBeenCalled();
  });
});
