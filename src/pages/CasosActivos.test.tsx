import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CasosActivos from './CasosActivos';

vi.mock('../api/db', () => ({
  getCasesPage: vi.fn(async () => ({
    rows: [
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
    ],
    total: 1,
  })),
  getPlazosResumenMany: vi.fn(async (caseIds: string[]) => new Map([["case-1", { alerta_urgencia: '', dias_restantes: 2 }]])),
  startSeguimiento: vi.fn(),
}));

vi.mock('../context/TenantContext', () => ({
  useTenant: () => ({
    tenant: { id: '07e8c686-29b9-44cb-b10a-99b8f357f99a', name: 'Demo' },
    user: null,
    isLoading: false,
    isPlatformAdmin: false,
    isTenantAdmin: true,
    error: null,
    refetch: async () => {},
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

describe('CasosActivos integration', () => {
  it('renderiza la lista de casos para el tenant', async () => {
    const qc = createTestQueryClient();

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <CasosActivos />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Descripcion de prueba')).toBeInTheDocument();
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });
  });
});
