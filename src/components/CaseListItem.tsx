import React, { useCallback } from 'react';
import { Eye } from 'lucide-react';
import { getStudentName } from '../utils/studentName';
import { formatDate } from '../utils/formatDate';
import { tipBadgeClasses } from '../utils/tipColors';
import { getCaseStatus } from '../utils/caseStatus';
import PlazoBadge from './PlazoBadge';
import EstadoBadge from './EstadoBadge';

type CaseListItemProps = {
  caso: any;
  plazoData?: any;
  onView?: () => void;
  onInitiateSeguimiento?: () => Promise<void>;
  onError?: (error: Error) => void;
};

const CaseListItem = React.memo(
  ({
    caso,
    plazoData = null,
    onView,
    onInitiateSeguimiento,
    onError,
  }: CaseListItemProps) => {
    const estadoRaw = getCaseStatus(caso, 'reportado');
    const initials = (getStudentName(caso.students, '') || 'NA')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();

    const handleInitiate = useCallback(async () => {
      try {
        if (onInitiateSeguimiento) {
          await onInitiateSeguimiento();
        }
      } catch (e) {
        if (onError && e instanceof Error) {
          onError(e);
        }
      }
    }, [onInitiateSeguimiento, onError]);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 hover:border-brand-200 transition-all shadow-sm hover:shadow-soft hover:-translate-y-[1px]">
        <div className="flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-700 shrink-0">
            {initials}
          </div>

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
                  {caso.short_description || caso.conduct_category || '—'}
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
                <EstadoBadge estado={estadoRaw} />
                {plazoData && (
                  <PlazoBadge
                    alerta_urgencia={plazoData.alerta_urgencia}
                    dias_restantes={plazoData.dias_restantes}
                    indagacion_due_date={caso.indagacion_due_date}
                  />
                )}
                {!plazoData && (
                  <PlazoBadge
                    alerta_urgencia=""
                    indagacion_due_date={caso.indagacion_due_date}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onView}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-brand-50 hover:border-brand-200 text-slate-700 tap-target transition-colors"
                  title="Ver detalle"
                  aria-label="Ver detalle"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={handleInitiate}
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
  },
  (prev, next) => {
    return (
      prev.caso.id === next.caso.id &&
      prev.caso.updated_at === next.caso.updated_at &&
      (prev.plazoData?.alerta_urgencia || '') ===
        (next.plazoData?.alerta_urgencia || '') &&
      (prev.plazoData?.dias_restantes || null) ===
        (next.plazoData?.dias_restantes || null)
    );
  },
);

CaseListItem.displayName = 'CaseListItem';

export default CaseListItem;
