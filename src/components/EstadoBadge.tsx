import React from 'react';

type EstadoBadgeProps = {
  estado?: string;
  label?: string;
};

const EstadoBadge = React.memo(
  ({ estado = 'reportado', label }: EstadoBadgeProps) => {
    const tone =
      estado === 'cerrado' ? 'slate' : estado === 'en seguimiento' ? 'green' : 'amber';
    const cls =
      tone === 'green'
        ? 'bg-green-100 text-green-800 border-green-200'
        : tone === 'amber'
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : 'bg-slate-100 text-slate-800 border-slate-200';

    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
        {label || estado}
      </span>
    );
  },
  (prev, next) => {
    return prev.estado === next.estado && prev.label === next.label;
  },
);

EstadoBadge.displayName = 'EstadoBadge';

export default EstadoBadge;
