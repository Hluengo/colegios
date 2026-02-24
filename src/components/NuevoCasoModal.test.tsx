import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import NuevoCasoModal from './NuevoCasoModal';

vi.mock('../context/TenantContext', () => ({
  useTenant: () => ({ tenant: { id: 't-1' }, isLoading: false }),
}));

// Mock supabase chainable calls
vi.mock('../api/supabaseClient', () => {
  const mockOrder = vi.fn();

  function makeChain() {
    return {
      order: mockOrder,
      eq: () => makeChain(),
      not: () => makeChain(),
      select: () => makeChain(),
    };
  }

  const mockSelect = vi.fn(() => makeChain());
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return {
    supabase: { from: mockFrom },
    __mocks: { mockOrder, mockFrom, mockSelect },
  };
});

vi.mock('../api/db', () => ({
  createCase: vi.fn(async (payload) => ({ id: 'case-1', ...payload })),
  addInvolucrado: vi.fn(),
}));

vi.mock('../hooks/useConductCatalog', () => ({
  __esModule: true,
  default: () => ({
    conductTypes: [{ key: 'Leve', label: 'Leve', sort_order: 1, active: true, color: '#111' }],
    catalogRows: [],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('../utils/refreshBus', () => ({ emitDataUpdated: vi.fn(), onDataUpdated: () => () => {} }));

vi.mock('../hooks/useToast', () => ({ useToast: () => ({ push: vi.fn() }) }));

import * as supClient from '../api/supabaseClient';
import { createCase } from '../api/db';
import { emitDataUpdated } from '../utils/refreshBus';

describe('NuevoCasoModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('guarda caso con tenant_id y emite refresh', async () => {
    // Prepare supabase mocks: first call returns courses, second returns students
    supClient.__mocks.mockOrder.mockResolvedValueOnce({ data: [{ course: '1A' }, { course: null }], error: null });
    supClient.__mocks.mockOrder.mockResolvedValueOnce({ data: [{ id: 's1', first_name: 'Ana', last_name: 'Perez', course: '1A' }], error: null });

    const onSaved = vi.fn();
    const onClose = vi.fn();

    render(<NuevoCasoModal onSaved={onSaved} onClose={onClose} />);

    // Wait for courses to load (selects are implemented as comboboxes)
    const selects = await screen.findAllByRole('combobox');
    const cursoSelect = selects[0];
    const estudianteSelect = selects[1];

    fireEvent.change(cursoSelect, { target: { value: '1A' } });
    // Wait for estudiantes to load
    await waitFor(() => expect(estudianteSelect.options.length).toBeGreaterThan(1));
    fireEvent.change(estudianteSelect, { target: { value: 's1' } });

    // Set fecha and hora using the shortcut buttons
    const hoyBtn = screen.getByText('Hoy');
    const ahoraBtn = screen.getByText('Ahora');
    fireEvent.click(hoyBtn);
    fireEvent.click(ahoraBtn);

    // Select tipo (button)
    const tipoBtn = await screen.findByText('Leve');
    fireEvent.click(tipoBtn);

    // Click save
    const saveBtn = screen.getByText('Guardar Caso');
    fireEvent.click(saveBtn);

    await waitFor(() => expect(createCase).toHaveBeenCalled());

    const calledWith = (createCase as any).mock.calls[0][0];
    expect(calledWith.tenant_id).toBe('t-1');
    expect(calledWith.student_id).toBe('s1');
    expect(calledWith.conduct_type).toBe('Leve');

    expect(emitDataUpdated).toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
