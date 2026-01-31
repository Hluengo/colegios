import { useEffect, useState } from 'react';
import { Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCases, getPlazosResumenMany, startSeguimiento } from '../api/db';
import { getStudentName } from '../utils/studentName';
import { emitDataUpdated } from '../utils/refreshBus';
import CaseDetailModal from '../components/CaseDetailModal';
import NuevoCasoModal from '../components/NuevoCasoModal';
import { formatDate } from '../utils/formatDate';
import { tipBadgeClasses } from '../utils/tipColors';
import { onDataUpdated } from '../utils/refreshBus';
import { logger } from '../utils/logger';

export default function CasosActivos() {
  const navigate = useNavigate();
  const [casos, setCasos] = useState([]);
  const [selectedCaso, setSelectedCaso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [plazos, setPlazos] = useState(new Map());

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const data = await getCases();

        // Solo casos no cerrados
        const activos = data.filter((c) => c.fields?.Estado !== 'Cerrado');

        // Helpers
        function parseLocalDate(fecha) {
          if (!fecha) return 0;
          if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            const [y, m, d] = fecha.split('-').map(Number);
            return new Date(y, m - 1, d).getTime();
          }
          return new Date(fecha).getTime() || 0;
        }

        // Resumen de plazos (1 llamada para todos)
        let m = new Map();
        try {
          const ids = activos.map((c) => c.id);
          m = await getPlazosResumenMany(ids);
          setPlazos(m);
        } catch (plErr) {
          logger.warn('No se pudo cargar resumen de plazos:', plErr?.message);
          m = new Map();
          setPlazos(new Map());
        }

        // Orden sugerido: urgencia de plazos > estado del caso > antigüedad
        function plazoRank(caso) {
          const r = m.get(caso.id);
          const txt = (r?.alerta_urgencia || '').toUpperCase();
          if (!r) return 5;
          if (!txt) return 4; // Sin plazo
          if (txt.includes('VENCIDO')) return 0;
          if (txt.includes('VENCE HOY')) return 1;
          if (txt.includes('PRÓXIMO') || txt.includes('PROXIMO')) return 2;
          if (txt.includes('EN PLAZO') || txt.includes('AL DÍA') || txt.includes('AL DIA')) return 3;
          return 5;
        }

        function estadoRank(caso) {
          const e = caso.fields?.Estado || 'Reportado';
          if (e === 'Reportado') return 0;
          if (e === 'En Seguimiento') return 1;
          return 2;
        }

        activos.sort((a, b) => {
          const pr = plazoRank(a) - plazoRank(b);
          if (pr !== 0) return pr;
          const er = estadoRank(a) - estadoRank(b);
          if (er !== 0) return er;
          return parseLocalDate(a.fields?.Fecha_Incidente) - parseLocalDate(b.fields?.Fecha_Incidente);
        });

        setCasos(activos);
      } catch (e) {
        logger.error(e);
      } finally {
        setLoading(false);
      }
    }

    cargar();

    // ✅ Escuchar cambios de datos
    const off = onDataUpdated(() => {
      logger.debug('🔄 Refrescando casos activos...');
      cargar();
    });

    return () => off();
  }, [refreshKey]);

  function businessDaysBetween(startDate, endDate) {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

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
      const deadline = caso?._supabaseData?.indagacion_due_date;
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
    else if (txt.includes('PRÓXIMO') || txt.includes('PROXIMO')) label = typeof dias === 'number' ? `${dias} DÍAS` : 'PRÓXIMO';
    else if (txt.includes('EN PLAZO') || txt.includes('AL DÍA') || txt.includes('AL DIA')) label = 'AL DÍA';

    const cls = txt.includes('VENCIDO')
      ? 'bg-red-50 text-red-700 border-red-200'
      : txt.includes('VENCE HOY')
        ? 'bg-red-50 text-red-700 border-red-200'
        : txt.includes('PRÓXIMO') || txt.includes('PROXIMO')
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200';

    return (
      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cls}`}>
        {label}
      </span>
    );
  }

  function renderEstadoBadge(caso) {
    const e = caso.fields?.Estado || 'Reportado';
    const tone = e === 'Cerrado' ? 'slate' : e === 'En Seguimiento' ? 'green' : 'amber';
    const cls =
      tone === 'green'
        ? 'bg-green-50 text-green-700 border-green-200'
        : tone === 'amber'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-slate-50 text-slate-700 border-slate-200';
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{e}</span>
    );
  }

  return (
    <div className="h-full p-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl font-black text-slate-900 tracking-tight truncate">
            Listado de Casos Activos
          </h2>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {casos.length} casos
          </span>
        </div>

        <button
          onClick={() => setNuevo(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold shadow"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nuevo Caso</span>
        </button>
      </div>

      <div className="glass-panel overflow-hidden flex flex-col border border-white/60 shadow-xl">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
          <span>Expedientes</span>
          <span>Etapa</span>
        </div>

        <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {loading && (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-full mb-2"></div>
              <p className="text-sm">Cargando expedientes...</p>
            </div>
          )}

          {!loading && casos.length === 0 && (
            <div className="p-10 text-center text-slate-400">
              <p>No hay casos activos.</p>
            </div>
          )}

          {!loading &&
            casos.map((caso) => {
              const estado = caso.fields?.Estado || 'Reportado';
              const initials = (getStudentName(caso.fields.Estudiante_Responsable, '') || 'NA')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase();

              return (
                <div
                  key={caso.id}
                  className="bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition shadow-sm"
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-600 shrink-0">
                      {initials}
                    </div>

                    {/* Main */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="text-sm font-extrabold text-slate-900 truncate">
                              {getStudentName(caso.fields.Estudiante_Responsable, 'Estudiante')}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold truncate">
                              {caso.fields.Curso_Incidente || '—'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {caso.fields.Descripcion || caso.fields.Categoria || '—'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipBadgeClasses(caso.fields.Tipificacion_Conducta)}`}
                          >
                            {caso.fields.Tipificacion_Conducta || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-semibold text-slate-400">
                            {formatDate(caso.fields.Fecha_Incidente)}
                          </span>
                          {renderEstadoBadge(caso)}
                          {renderPlazoBadge(caso)}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedCaso(caso)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="Ver detalle"
                            aria-label="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                if (estado === 'Reportado') {
                                  await startSeguimiento(caso.id);
                                  emitDataUpdated();
                                }
                                navigate(`/seguimientos/${caso.id}`);
                              } catch (e) {
                                alert(`No se pudo iniciar seguimiento: ${e?.message || e}`);
                              }
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-bold hover:opacity-90 ${
                              estado === 'Reportado'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            {estado === 'Reportado' ? 'Iniciar seguimiento' : 'Seguimiento'}
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
          setRefreshKey={setRefreshKey}
        />
      )}

      {nuevo && (
        <NuevoCasoModal
          onClose={() => setNuevo(false)}
          onSaved={() => {
            setNuevo(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
