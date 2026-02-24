import React, { useContext, useEffect } from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ToastContext from './toastContext';

function Tester({ onCalled }: { onCalled?: (v: any) => void }) {
  const { push } = useContext(ToastContext as any);
  useEffect(() => {
    push({ title: 't', message: 'm' } as any);
    onCalled && onCalled(true);
  }, [push, onCalled]);
  return null;
}

describe('ToastContext', () => {
  it('default push is a noop and does not throw when used without provider', () => {
    expect(() => render(<Tester />)).not.toThrow();
  });

  it('provider push is called when provided', () => {
    const mock = vi.fn();
    const called = vi.fn();

    render(
      <ToastContext.Provider value={{ push: mock }}>
        <Tester onCalled={called} />
      </ToastContext.Provider>
    );

    expect(called).toHaveBeenCalled();
    expect(mock).toHaveBeenCalledWith({ title: 't', message: 'm' });
  });
});
