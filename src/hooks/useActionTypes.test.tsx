import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import useActionTypes from './useActionTypes';

vi.mock('../context/TenantContext', () => ({
  useTenant: () => ({
    tenant: { id: 't-1' },
    isLoading: false,
  }),
}));

// Mock supabase chainable calls inside the factory to avoid hoisting issues
vi.mock('../api/supabaseClient', () => {
  const mockOrder = vi.fn();
  const mockEq2 = vi.fn(() => ({ order: mockOrder }));
  const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
  const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return {
    supabase: {
      from: mockFrom,
    },
    __mocks: { mockOrder, mockFrom, mockSelect, mockEq1, mockEq2 },
  };
});

// Import the mocked helpers
import * as supClient from '../api/supabaseClient';

function TestComponent() {
  const { actions, loading } = useActionTypes();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="actions">{JSON.stringify(actions)}</div>
    </div>
  );
}

describe('useActionTypes hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads action types from supabase when available', async () => {
    supClient.__mocks.mockOrder.mockResolvedValue({ data: [{ label: 'A' }, { label: 'B' }], error: null });

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('actions').textContent).toContain('A');
    expect(supClient.__mocks.mockFrom).toHaveBeenCalledWith('action_types');
    expect(supClient.__mocks.mockSelect).toHaveBeenCalled();
  });

  it('falls back to defaults on fetch error', async () => {
    supClient.__mocks.mockOrder.mockResolvedValue({ data: null, error: { message: 'boom' } });

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('actions').textContent).toContain('Entrevista');
  });
});
