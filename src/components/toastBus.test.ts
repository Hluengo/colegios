import { describe, it, expect, vi } from 'vitest';
import { emitToast, subscribeToast } from './toastBus';

describe('toastBus', () => {
  it('calls subscribed listeners when emitToast is called', () => {
    const fn = vi.fn();
    const off = subscribeToast(fn);

    const msg = { type: 'success', title: 'hola', message: 'mundo' };
    emitToast(msg);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(msg);

    off();
  });

  it('allows multiple listeners and unsubscribing one does not remove others', () => {
    const a = vi.fn();
    const b = vi.fn();

    const offA = subscribeToast(a);
    const offB = subscribeToast(b);

    const first = { message: 'first' };
    emitToast(first);

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    offA();

    const second = { message: 'second' };
    emitToast(second);

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);

    offB();
  });
});
