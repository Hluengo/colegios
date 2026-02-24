import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Folder, Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getCasesPage,
  getPlazosResumenMany,
  startSeguimiento,
} from '../api/db';
import { emitDataUpdated } from '../utils/refreshBus';
import CaseDetailModal from '../components/CaseDetailModal';
import NuevoCasoModal from '../components/NuevoCasoModal';
import { onDataUpdated } from '../utils/refreshBus';
import { logger } from '../utils/logger';
import { parseLocalDate } from '../utils/dateUtils';
import InlineError from '../components/InlineError';
import usePersistedState from '../hooks/usePersistedState';
import { getCaseStatus } from '../utils/caseStatus';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../hooks/useToast';
import { queryKeys } from '../lib/queryClient';
import { Button } from '../components/ui';
import CaseListHeader from '../components/CaseListHeader';
import CaseListItem from '../components/CaseListItem';
import PaginationControls from '../components/PaginationControls';

export default function CasosActivos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const { push } = useToast();
  const tenantId = tenant?.id || '';
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCaso, setSelectedCaso] = useState(null);
  const [nuevo, setNuevo] = useState(false);
  const [search, setSearch] = usePersistedState(
    `casosActivos:${tenantId}:search`,
    '',
  );
  const [estadoFiltro, setEstadoFiltro] = usePersistedState(
    `casosActivos:${tenantId}:estado`,
    'Todos',
  );
  const [pageSize, setPageSize] = usePersistedState(
    `casosActivos:${tenantId}:pageSize`,
    10,
  );
  const [page, setPage] = usePersistedState(`casosActivos:${tenantId}:page`, 1);

  useEffect(() => {
    const estudianteFromQuery = (searchParams.get('estudiante') || '').trim();
    if (!estudianteFromQuery) return;

    setSearch(estudianteFromQuery);
    setPage(1);

    const next = new URLSearchParams(searchParams);
    next.delete('estudiante');
    setSearchParams(next, { replace: true });
  }, [searchParams, setPage, setSearch, setSearchParams]);

  const {
    data: casesPage,
    isLoading: loadingCases,
    error: errorCases,
    refetch: refetchCases,
  } = useQuery({
    queryKey: queryKeys.cases.activos(
      tenantId,
      page,
      pageSize,
      estadoFiltro,
      search || '',
    ),
    queryFn: () =>
      getCasesPage({
        excludeStatus: 'Cerrado',
        status: estadoFiltro !== 'Todos' ? estadoFiltro : null,
        search,
        page,
        pageSize,
        tenantId: tenantId || null,
      }),
    enabled: Boolean(tenantId),
  });

  const activos = useMemo(() => casesPage?.rows || [], [casesPage]);
  const totalCasos = casesPage?.total || 0;
  const caseIds = useMemo(() => activos.map((c) => c.id), [activos]);

  const {
    data: plazos = new Map(),
    isLoading: loadingPlazos,
    error: errorPlazos,
    refetch: refetchPlazos,
  } = useQuery({
    queryKey: ['plazos', 'resumen-many', tenantId, ...caseIds],
    queryFn: () => getPlazosResumenMany(caseIds),
    enabled: Boolean(tenantId) && caseIds.length > 0,
  });

  const casos = useMemo(() => {
    const rows = [...activos];

    function plazoRank(caso) {
      const r = plazos.get(caso.id);
      const txt = (r?.alerta_urgencia || '').toUpperCase();
      if (!r) return 5;
      if (!txt) return 4;
      if (txt.includes('VENCIDO')) return 0;
      if (txt.includes('VENCE HOY')) return 1;
      if (txt.includes('PRÓXIMO') || txt.includes('PROXIMO')) return 2;
      if (
        txt.includes('EN PLAZO') ||
        txt.includes('AL DÍA') ||
        txt.includes('AL DIA')
      )
        return 3;
      return 5;
    }

    function estadoRank(caso) {
      const e = getCaseStatus(caso, 'reportado');
      if (e === 'reportado') return 0;
      if (e === 'en seguimiento') return 1;
      return 2;
    }

    rows.sort((a, b) => {
      const pr = plazoRank(a) - plazoRank(b);
      if (pr !== 0) return pr;
      const er = estadoRank(a) - estadoRank(b);
      if (er !== 0) return er;
      const da = parseLocalDate(a.incident_date)?.getTime() || 0;
      const db = parseLocalDate(b.incident_date)?.getTime() || 0;
      return da - db;
    });

    return rows;
  }, [activos, plazos]);

  useEffect(() => {
    if (!errorCases && !errorPlazos) return;
    logger.error(errorCases || errorPlazos);
  }, [errorCases, errorPlazos]);

  useEffect(() => {
    const off = onDataUpdated(() => {
      logger.debug('🔄 Refrescando casos activos...');
      queryClient.invalidateQueries({
        queryKey: queryKeys.cases.activos(
          tenantId,
          page,
          pageSize,
          estadoFiltro,
          search || '',
        ),
      });
      queryClient.invalidateQueries({
        queryKey: ['plazos', 'resumen-many', tenantId],
      });
    });

    return () => off();
  }, [tenantId, page, pageSize, estadoFiltro, search, queryClient]);

  const loading = loadingCases || (caseIds.length > 0 && loadingPlazos);
  const error = errorCases || errorPlazos;
  const totalPages = Math.max(1, Math.ceil(totalCasos / pageSize));
  const currentPage = Math.min(page, totalPages);

  // Memoized handlers
  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    [setSearch],
  );

  const handleEstadoChange = useCallback(
    (value: string) => {
      setEstadoFiltro(value);
      setPage(1);
    },
    [setEstadoFiltro],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    [setPageSize],
  );

  const handleNewCase = useCallback(async () => {
    setNuevo(true);
  }, []);

  const handleInitiateSeguimiento = useCallback(
    (caseId: string, estadoRaw: string) => async () => {
      try {
        if (estadoRaw === 'reportado') {
          await startSeguimiento(caseId);
          emitDataUpdated();
        }
        navigate(`/seguimientos/${caseId}`);
      } catch (e) {
        push({
          type: 'error',
          title: 'Seguimiento',
          message:
            e?.message || 'No se pudo iniciar el seguimiento del caso',
        });
      }
    },
    [navigate, push],
  );

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setEstadoFiltro('Todos');
    setPage(1);
  }, [setSearch, setEstadoFiltro]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage],
  );

  const pagedCasos = useMemo(() => casos, [casos]);

  return (
    <div className="h-full p-2">
      {error && (
        <div className="mb-4">
          <InlineError
            title="Error al cargar casos"
            message={error?.message || String(error)}
            onRetry={() => {
              refetchCases();
              if (caseIds.length > 0) refetchPlazos();
            }}
          />
        </div>
      )}

      {/* Header with title and new case button */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-[1.375rem] font-semibold text-slate-900 tracking-tight truncate">
            Listado de Casos Activos
          </h2>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {totalCasos} casos
          </span>
        </div>

        <Button
          onClick={handleNewCase}
          leftIcon={<Plus size={18} />}
          className="shadow-soft"
        >
          <span className="hidden sm:inline">Nuevo Caso</span>
        </Button>
      </div>

      {/* Search and filters header */}
      <CaseListHeader
        search={search}
        onSearchChange={handleSearch}
        estadoFiltro={estadoFiltro}
        onEstadoChange={handleEstadoChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        onNewClick={handleNewCase}
        filterOptions={[
          { label: 'Todos', value: 'Todos' },
          { label: 'Reportado', value: 'Reportado' },
          { label: 'En Seguimiento', value: 'En Seguimiento' },
        ]}
      />

      <div className="glass-panel overflow-hidden flex flex-col border border-slate-200 shadow-sm ring-1 ring-brand-100/50">
        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-brand-50/70 to-transparent backdrop-blur-sm flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-wider shrink-0">
          <span>Expedientes</span>
          <span>Etapa</span>
        </div>

        <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-200 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && totalCasos === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Folder className="text-slate-400" size={28} />
              </div>
              <p className="text-slate-600 font-medium mb-4">
                No hay casos activos en este momento.
              </p>
              <Button
                onClick={handleNewCase}
                leftIcon={<Plus size={18} />}
                className="shadow-soft"
              >
                Crear nuevo caso
              </Button>
            </div>
          )}

          {!loading && totalCasos > 0 && casos.length === 0 && (
            <div className="p-10 text-center">
              <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Folder className="text-slate-400" size={20} />
              </div>
              <p className="text-slate-600 font-medium mb-3">
                No hay resultados con los filtros seleccionados.
              </p>
              <Button
                onClick={handleClearFilters}
                leftIcon={<Folder size={16} />}
                variant="secondary"
              >
                Limpiar filtros
              </Button>
            </div>
          )}

          {!loading &&
            pagedCasos.map((caso) => {
              const estadoRaw = getCaseStatus(caso, 'reportado');
              const plazoData = plazos.get(caso.id) || null;

              return (
                <CaseListItem
                  key={caso.id}
                  caso={caso}
                  plazoData={plazoData}
                  onView={() => setSelectedCaso(caso)}
                  onInitiateSeguimiento={handleInitiateSeguimiento(
                    caso.id,
                    estadoRaw,
                  )}
                  onError={(err) => {
                    push({
                      type: 'error',
                      title: 'Seguimiento',
                      message: err.message,
                    });
                  }}
                />
              );
            })}
        </div>

        {!loading && totalCasos > 0 && (
          <PaginationControls
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCasos}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
        )}
      </div>

      {selectedCaso && (
        <CaseDetailModal
          caso={selectedCaso}
          onClose={() => setSelectedCaso(null)}
        />
      )}

      {nuevo && (
        <NuevoCasoModal
          onClose={() => setNuevo(false)}
          onSaved={() => {
            setNuevo(false);
            queryClient.invalidateQueries({
              queryKey: queryKeys.cases.activos(
                tenantId,
                page,
                pageSize,
                estadoFiltro,
                search || '',
              ),
            });
          }}
        />
      )}
    </div>
  );
}
