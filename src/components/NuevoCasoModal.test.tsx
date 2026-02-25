import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';


vi.mock('../context/TenantContext', () => ({
  useTenant: () => ({ tenant: { id: 't-1' }, isLoading: false }),
}));

// Mock supabase chainable calls
vi.mock('../api/supabaseClient', () => {
  // Mock supabase with deterministic responses based on query args
  const supabase = {
    from: () => ({
      select: (cols: any) => {
        const filters: Array<[string, any]> = [];

        const obj: any = {
          not: () => obj,
          eq: (field: string, val: any) => {
            filters.push([field, val]);
            return obj;
          },
          order: async (by: string) => {
            // cargarCursos -> select('course').not(...).order('course')
            if (typeof cols === 'string' && cols.includes('course') && by === 'course') {
              return { data: [{ course: '1A' }, { course: null }], error: null };
            }

            // cargarEstudiantes -> if filters include course='1A', return students
            const hasCourseFilter = filters.some(([f, v]) => f === 'course' && v === '1A');
            if (hasCourseFilter && by === 'last_name') {
              return {
                data: [{ id: 's1', first_name: 'Ana', last_name: 'Perez', course: '1A' }],
                error: null,
              };
            }

            return { data: [], error: null };
          },
        };

        return obj;
      },
    }),
  } as any;

  return {
    supabase,
    subscribeAuthChanges: vi.fn(),
    unsubscribeAuthChanges: vi.fn(),
    setSessionToken: vi.fn(),
    getSessionToken: vi.fn(() => null),
    clearSessionToken: vi.fn(),
    checkSupabaseConnection: vi.fn().mockResolvedValue(true),
    getSupabaseClient: vi.fn(),
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
    // Import the component after setting up mocks so module imports pick up the mocks
    const Mod = (await import('./NuevoCasoModal')) as any;
    const NuevoCasoModal = Mod.default || Mod.NuevoCasoModal || Mod;
    // No-op: supabase mock responds deterministically based on query args

    const onSaved = vi.fn();
    const onClose = vi.fn();

    render(<NuevoCasoModal onSaved={onSaved} onClose={onClose} />);

    // Wait for courses to load (selects are implemented as comboboxes)
    const selects = await screen.findAllByRole('combobox');
    const cursoSelect = selects[0];
    const estudianteSelect = selects[1];

    fireEvent.change(cursoSelect, { target: { value: '1A' } });
    // Esperar a que la lista de estudiantes se renderice y luego seleccionar
    await screen.findByText('Ana Perez');
    fireEvent.change(estudianteSelect, { target: { value: 's1' } });

    // Debug: valores seleccionados
    // eslint-disable-next-line no-console
    console.log('DEBUG selects', { curso: (cursoSelect as any).value, estudiante: (estudianteSelect as any).value });

    // Set fecha and hora using the shortcut buttons
    const hoyBtn = screen.getByText('Hoy');
    const ahoraBtn = screen.getByText('Ahora');
    fireEvent.click(hoyBtn);
    fireEvent.click(ahoraBtn);

    // Select tipo (button)
    const tipoBtn = await screen.findByText('Leve');
    fireEvent.click(tipoBtn);

    // Click save (wait until enabled)
    const saveBtn = screen.getByText('Guardar Caso');
    await waitFor(() => expect(saveBtn).not.toBeDisabled());
    fireEvent.click(saveBtn);

    // Debug info (helps diagnose intermittent failures)
    // eslint-disable-next-line no-console
    console.log('DEBUG createCase.calls=', (createCase as any).mock.calls.length);

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
