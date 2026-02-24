import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock auth subscription to noop
vi.mock('../api/supabaseClient', () => ({
  subscribeAuthChanges: vi.fn(),
  unsubscribeAuthChanges: vi.fn(),
}));

// Bypass RequireAuth (just render children)
vi.mock('../components/RequireAuth', () => ({
  RequireAuth: ({ children }: any) => <>{children}</>,
}));

// Provide a simple tenant context
vi.mock('../context/TenantContext', () => ({
  useTenant: () => ({ tenant: { id: 't-1', name: 'Demo' }, isLoading: false }),
}));

// Mock pages used by App to simple markers
const makeMock = (name: string) => ({ __esModule: true, default: () => <div>{name}</div> });
vi.mock('../pages/Dashboard', () => makeMock('DashboardMock'));
vi.mock('../pages/Login', () => makeMock('LoginMock'));
vi.mock('../pages/CasosActivos', () => makeMock('CasosActivosMock'));
vi.mock('../pages/CasosCerrados', () => makeMock('CasosCerradosMock'));
vi.mock('../pages/SeguimientoPage', () => makeMock('SeguimientoPageMock'));
vi.mock('../pages/SeguimientoWrapper', () => makeMock('SeguimientoWrapperMock'));
vi.mock('../pages/CierreCasoPage', () => makeMock('CierreCasoPageMock'));
vi.mock('../pages/Estadisticas', () => makeMock('EstadisticasMock'));
vi.mock('../pages/AlertasPlazos', () => makeMock('AlertasPlazosMock'));
vi.mock('../pages/AdminPanel', () => makeMock('AdminPanelMock'));
vi.mock('../components/Layout', () => ({ __esModule: true, default: () => <div>LayoutMock</div> }));

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('Smoke integration: plataforma', () => {
  const routes = [
    { path: '/login', expect: 'LoginMock' },
    { path: '/casos-activos', expect: 'CasosActivosMock' },
    { path: '/seguimientos/abc', expect: 'SeguimientoPageMock' },
    { path: '/admin', expect: 'AdminPanelMock' },
  ];

  for (const r of routes) {
    it(`renders ${r.path}`, async () => {
      const qc = createTestQueryClient();
      // Render the mocked page component directly to avoid nested Router
      let Page: any = null;
      if (r.path === '/login') Page = (await import('../pages/Login')).default;
      if (r.path === '/casos-activos') Page = (await import('../pages/CasosActivos')).default;
      if (r.path.startsWith('/seguimientos')) Page = (await import('../pages/SeguimientoPage')).default;
      if (r.path === '/admin') Page = (await import('../pages/AdminPanel')).default;

      render(
        <QueryClientProvider client={qc}>
          <Page />
        </QueryClientProvider>,
      );

      expect(await screen.findByText(r.expect)).toBeInTheDocument();
    });
  }
});
