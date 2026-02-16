import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración del QueryClient para TanStack Query
 * Reemplaza el sistema de caché personalizado
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo hasta que los datos se consideran stale
      staleTime: 30 * 1000, // 30 segundos
      // Tiempo máximo que los datos permanecen en caché
      gcTime: 5 * 60 * 1000, // 5 minutos
      // Número de reintentos automáticos
      retry: 3,
      // No refetch al volver a enfocar la ventana
      refetchOnWindowFocus: false,
      // No refetch al montar el componente
      refetchOnMount: false,
    },
    mutations: {
      // Retry solo 1 vez para mutaciones
      retry: 1,
    },
  },
});

// Keys de queries para consistencia
export const queryKeys = {
  cases: {
    all: ['cases'],
    allByTenant: (tenantId: string) => ['cases', 'all', tenantId],
    lists: () => [...queryKeys.cases.all, 'list'],
    list: (filters) => [...queryKeys.cases.lists(), filters],
    details: () => [...queryKeys.cases.all, 'detail'],
    detail: (id) => [...queryKeys.cases.details(), id],
    activos: (
      tenantId: string,
      page: number,
      pageSize: number,
      estado: string,
      search: string,
    ) => ['cases', 'activos', tenantId, page, pageSize, estado, search],
    cerrados: (tenantId: string, page: number, pageSize: number, search: string) =>
      ['cases', 'cerrados', tenantId, page, pageSize, search],
    seguimiento: (tenantId: string) => ['cases', 'seguimiento', tenantId],
  },
  catalog: {
    all: ['catalog'],
    conductTypes: (tenantId: string) => [
      ...queryKeys.catalog.all,
      'conduct-types',
      tenantId,
    ],
    conductCatalog: (tenantId: string) => [
      ...queryKeys.catalog.all,
      'conduct-catalog',
      tenantId,
    ],
  },
  alerts: {
    all: ['alerts'],
    plazos: (tenantId: string) => [...queryKeys.alerts.all, 'plazos', tenantId],
  },
  students: {
    all: ['students'],
    byCourse: (tenantId: string, course: string) => [
      'students',
      'course',
      tenantId,
      course,
    ],
  },
};

export default queryClient;
