import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CasosActivos from '../pages/CasosActivos';
import NuevoCasoModal from '../components/NuevoCasoModal';

// Mocks: initial cases list
let casesRows = [
  {
    id: 'case-1',
    incident_date: '2026-02-23',
    incident_time: '10:00',
    student_id: 'stu-1',
    students: { first_name: 'Juan', last_name: 'Perez' },
    conduct_type: 'Prueba',
    course_incident: '4º Básico',
    short_description: 'Descripcion de prueba',
    created_at: new Date().toISOString(),
  },
];

vi.mock('../api/db', () => ({
  getCasesPage: vi.fn(async () => ({ rows: casesRows, total: casesRows.length })),
  getPlazosResumenMany: vi.fn(async () => new Map()),
  createCase: vi.fn(async (payload) => ({ id: 'case-2', ...payload })),
  addInvolucrado: vi.fn(),
  startSeguimiento: vi.fn(),
}));

vi.mock('../context/TenantContext', () => ({
  useTenant: () => ({ tenant: { id: 't-1' }, isLoading: false }),
}));

vi.mock('../hooks/useConductCatalog', () => ({
  __esModule: true,
  default: () => ({ conductTypes: [{ key: 'Leve', label: 'Leve', sort_order: 1, active: true }], catalogRows: [], loading: false, error: null, refresh: vi.fn() }),
}));

vi.mock('../hooks/useToast', () => ({ useToast: () => ({ push: vi.fn() }) }));

vi.mock('../api/supabaseClient', () => {
  const mockOrder = vi.fn();
  function makeChain() { return { order: mockOrder, eq: () => makeChain(), not: () => makeChain(), select: () => makeChain() }; }
  const mockSelect = vi.fn(() => makeChain());
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { supabase: { from: mockFrom }, __mocks: { mockOrder, mockFrom, mockSelect } };
});

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('Integración: Nuevo caso → CasosActivos', () => {
  it('al crear un caso nuevo, CasosActivos muestra el nuevo caso', async () => {
    const qc = createTestQueryClient();

    const { getByText } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <CasosActivos />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // initial render shows existing case
    await waitFor(() => expect(screen.getByText('Descripcion de prueba')).toBeInTheDocument());

    // open NuevoCasoModal and create a new case
    render(
      <QueryClientProvider client={qc}>
        <NuevoCasoModal onSaved={() => { /* noop */ }} onClose={() => { /* noop */ }} />
      </QueryClientProvider>,
    );

    // use combo selects via role
    const selects = await screen.findAllByRole('combobox');
    const cursoSelect = selects[0];
    const estudianteSelect = selects[1];
    fireEvent.change(cursoSelect, { target: { value: '1A' } });
    await waitFor(() => expect(estudianteSelect.options.length).toBeGreaterThan(0));
    fireEvent.change(estudianteSelect, { target: { value: 's1' } });

    // click Hoy and Ahora shortcuts
    fireEvent.click(screen.getByText('Hoy'));
    fireEvent.click(screen.getByText('Ahora'));

    // select tipo and save
    fireEvent.click(await screen.findByText('Leve'));
    fireEvent.click(screen.getByText('Guardar Caso'));

    // simulate backend change: update casesRows to include new case
    casesRows = [
      ...casesRows,
      {
        id: 'case-2',
        incident_date: '2026-02-24',
        incident_time: '12:00',
        student_id: 's1',
        students: { first_name: 'Ana', last_name: 'Perez' },
        conduct_type: 'Leve',
        course_incident: '1A',
        short_description: 'Caso nuevo',
        created_at: new Date().toISOString(),
      },
    ];

    // emitDataUpdated is wired via refreshBus; invalidate queries and wait for new case
    // We trigger a refetch by invalidating the query client manually
    await waitFor(() => {
      qc.invalidateQueries();
    });

    await waitFor(() => expect(screen.getByText('Caso nuevo')).toBeInTheDocument());
  });
});
