import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Plus, Folder, Search, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getCasesPage,
  getPlazosResumenMany,
  startSeguimiento,
} from '../api/db';
import { getStudentName } from '../utils/studentName';
import { emitDataUpdated } from '../utils/refreshBus';
import CaseDetailModal from '../components/CaseDetailModal';
import NuevoCasoModal from '../components/NuevoCasoModal';
import { formatDate } from '../utils/formatDate';
import { tipBadgeClasses } from '../utils/tipColors';
import { onDataUpdated } from '../utils/refreshBus';
import { logger } from '../utils/logger';
import { parseLocalDate } from '../utils/dateUtils';
import InlineError from '../components/InlineError';
import usePersistedState from '../hooks/usePersistedState';
import { getCaseStatus, getCaseStatusLabel } from '../utils/caseStatus';
import { useTenant } from '../context/TenantContext';
import { useToast } from '../hooks/useToast';
import { queryKeys } from '../lib/queryClient';
import { Button, Input, Select } from '../components/ui';

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

  function businessDaysBetween(startDate, endDate) {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
      return null;

    // Normalize to midnight
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let days = 0;
    const step = start <= end ? 1 : -1;
    let current = new Date(start);

    while ((step > 0 && current < end) || (step < 0 && current > end)) {
      current.setDate(current.getDate() + step);
      const dow = current.getDay(); // 0=Sun..6=Sat
      if (dow !== 0 && dow !== 6) days += step;
    }

    return days;
  }

  function renderPlazoBadge(caso) {
    const r = plazos.get(caso.id) || null;
    const txt = (r?.alerta_urgencia || '').toUpperCase();
    const dias = r?.dias_restantes ?? null;

    if (!r || dias === null || txt.includes('SIN PLAZO')) {
      const deadline = caso?.indagacion_due_date;
      const fallbackDays = businessDaysBetween(new Date(), deadline);

      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
          {typeof fallbackDays === 'number'
            ? `${fallbackDays} DÍAS`
            : 'SIN PLAZO'}
        </span>
      );
    }

    if (!txt) {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
          SIN PLAZO
        </span>
      );
    }

    let label = txt;
    if (txt.includes('VENCE HOY')) label = 'VENCE HOY';
    else if (txt.includes('VENCIDO')) label = 'VENCIDO';
    else if (txt.includes('PRÓXIMO') || txt.includes('PROXIMO'))
      label = typeof dias === 'number' ? `${dias} DÍAS` : 'PRÓXIMO';
    else if (
      txt.includes('EN PLAZO') ||
      txt.includes('AL DÍA') ||
      txt.includes('AL DIA')
    )
      label = 'AL DÍA';

    const cls = txt.includes('VENCIDO')
      ? 'bg-red-100 text-red-800 border-red-200'
      : txt.includes('VENCE HOY')
        ? 'bg-red-100 text-red-800 border-red-200'
        : txt.includes('PRÓXIMO') || txt.includes('PROXIMO')
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : 'bg-emerald-100 text-emerald-800 border-emerald-200';

    return (
      <span
        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cls}`}
      >
        {label}
      </span>
    );
  }

  function renderEstadoBadge(caso) {
    const e = getCaseStatus(caso, 'reportado');
    const label = getCaseStatusLabel(caso, 'Reportado');
    const tone =
      e === 'cerrado' ? 'slate' : e === 'en seguimiento' ? 'green' : 'amber';
    const cls =
      tone === 'green'
        ? 'bg-green-100 text-green-800 border-green-200'
        : tone === 'amber'
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : 'bg-slate-100 text-slate-800 border-slate-200';
    return (
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}
      >
        {label}
      </span>
    );
  }

  const loading = loadingCases || (caseIds.length > 0 && loadingPlazos);
  const error = errorCases || errorPlazos;
  const totalPages = Math.max(1, Math.ceil(totalCasos / pageSize));
  const currentPage = Math.min(page, totalPages);
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
      {/* Header */}
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
          onClick={() => setNuevo(true)}
          leftIcon={<Plus size={18} />}
          className="shadow-soft"
        >
          <span className="hidden sm:inline">Nuevo Caso</span>
        </Button>
      </div>

      {!loading && totalCasos > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 mt-4 text-sm text-slate-600 gap-2">
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Anterior
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 px-2 mb-4">
        <Input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por estudiante, curso o conducta"
          className="flex-1"
        />
        <Select
          value={estadoFiltro}
          onChange={(e) => {
            setEstadoFiltro(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'Todos', label: 'Todos' },
            { value: 'Reportado', label: 'Reportado' },
            { value: 'En Seguimiento', label: 'En Seguimiento' },
          ]}
          className="w-full sm:w-auto sm:min-w-[160px]"
        />
        <Select
          value={String(pageSize)}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          options={[
            { value: '10', label: '10 por página' },
            { value: '20', label: '20 por página' },
            { value: '50', label: '50 por página' },
          ]}
          className="w-full sm:w-auto sm:min-w-[150px]"
        />
        <Button
          onClick={() => {
            setSearch('');
            setEstadoFiltro('Todos');
            setPage(1);
          }}
          variant="secondary"
        >
          Limpiar
        </Button>
      </div>

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
                onClick={() => setNuevo(true)}
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
                <Search className="text-slate-400" size={20} />
              </div>
              <p className="text-slate-600 font-medium mb-3">
                No hay resultados con los filtros seleccionados.
              </p>
              <Button
                onClick={() => {
                  setSearch('');
                  setEstadoFiltro('Todos');
                  setPage(1);
                }}
                leftIcon={<X size={16} />}
                variant="secondary"
              >
                Limpiar filtros
              </Button>
            </div>
          )}

          {!loading &&
            pagedCasos.map((caso) => {
              const estadoRaw = getCaseStatus(caso, 'reportado');
              const initials = (getStudentName(caso.students, '') || 'NA')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase();

              return (
                <div
                  key={caso.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-brand-200 transition-all shadow-sm hover:shadow-soft hover:-translate-y-[1px]"
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-700 shrink-0">
                      {initials}
                    </div>

                    {/* Main */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="text-sm font-extrabold text-slate-900 truncate">
                              {getStudentName(caso.students, 'Estudiante')}
                            </h4>
                            <span className="text-[10px] text-slate-600 font-semibold truncate">
                              {caso.course_incident || '—'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                            {caso.short_description ||
                              caso.conduct_category ||
                              '—'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipBadgeClasses(caso.conduct_type)}`}
                          >
                            {caso.conduct_type || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-semibold text-slate-600">
                            {formatDate(caso.incident_date)}
                          </span>
                          {renderEstadoBadge(caso)}
                          {renderPlazoBadge(caso)}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedCaso(caso)}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-brand-50 hover:border-brand-200 text-slate-700 tap-target transition-colors"
                            title="Ver detalle"
                            aria-label="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                if (estadoRaw === 'reportado') {
                                  await startSeguimiento(caso.id);
                                  emitDataUpdated();
                                }
                                navigate(`/seguimientos/${caso.id}`);
                              } catch (e) {
                                push({
                                  type: 'error',
                                  title: 'Seguimiento',
                                  message:
                                    e?.message ||
                                    'No se pudo iniciar el seguimiento del caso',
                                });
                              }
                            }}
                            className={`px-3 py-2.5 rounded-lg text-xs font-semibold hover:opacity-90 ${
                              estadoRaw === 'reportado'
                                ? 'bg-amber-600 text-white'
                                : 'bg-brand-600 text-white hover:bg-brand-700'
                            } tap-target inline-flex items-center justify-center`}
                          >
                            {estadoRaw === 'reportado'
                              ? 'Iniciar seguimiento'
                              : 'Seguimiento'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
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
