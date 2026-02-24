import React from 'react';

type PlazoBadgeProps = {
  alerta_urgencia?: string;
  dias_restantes?: number | null;
  indagacion_due_date?: string;
};

const PlazoBadge = React.memo(
  ({
    alerta_urgencia = '',
    dias_restantes = null,
    indagacion_due_date,
  }: PlazoBadgeProps) => {
    function businessDaysBetween(
      startDate: string | Date | null,
      endDate: string | Date | null,
    ) {
      if (!startDate || !endDate) return null;
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
        return null;

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      let days = 0;
      const step = start <= end ? 1 : -1;
      let current = new Date(start);

      while ((step > 0 && current < end) || (step < 0 && current > end)) {
        current.setDate(current.getDate() + step);
        const dow = current.getDay();
        if (dow !== 0 && dow !== 6) days += step;
      }

      return days;
    }

    const txt = alerta_urgencia.toUpperCase();

    if (!alerta_urgencia || txt.includes('SIN PLAZO')) {
      const fallbackDays = businessDaysBetween(new Date(), indagacion_due_date);
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
          {typeof fallbackDays === 'number'
            ? `${fallbackDays} DÍAS`
            : 'SIN PLAZO'}
        </span>
      );
    }

    let label = txt;
    if (txt.includes('VENCE HOY')) label = 'VENCE HOY';
    else if (txt.includes('VENCIDO')) label = 'VENCIDO';
    else if (txt.includes('PRÓXIMO') || txt.includes('PROXIMO'))
      label =
        typeof dias_restantes === 'number'
          ? `${dias_restantes} DÍAS`
          : 'PRÓXIMO';
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
  },
  (prev, next) => {
    return (
      prev.alerta_urgencia === next.alerta_urgencia &&
      prev.dias_restantes === next.dias_restantes &&
      prev.indagacion_due_date === next.indagacion_due_date
    );
  },
);

PlazoBadge.displayName = 'PlazoBadge';

export default PlazoBadge;
