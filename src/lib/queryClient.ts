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
    lists: () => [...queryKeys.cases.all, 'list'],
    list: (filters) => [...queryKeys.cases.lists(), filters],
    details: () => [...queryKeys.cases.all, 'detail'],
    detail: (id) => [...queryKeys.cases.details(), id],
    activos: (page, pageSize) => ['cases', 'activos', page, pageSize],
    cerrados: (page, pageSize) => ['cases', 'cerrados', page, pageSize],
    seguimiento: () => ['cases', 'seguimiento'],
  },
  catalog: {
    all: ['catalog'],
    conductTypes: () => [...queryKeys.catalog.all, 'conduct-types'],
    conductCatalog: () => [...queryKeys.catalog.all, 'conduct-catalog'],
  },
  alerts: {
    all: ['alerts'],
    plazos: () => [...queryKeys.alerts.all, 'plazos'],
  },
  students: {
    all: ['students'],
    byCourse: (course) => ['students', 'course', course],
  },
};

export default queryClient;
