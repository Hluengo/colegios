import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  color?: string;
  onClick?: () => void;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'bg-brand-100 text-brand-700',
  onClick,
}: StatCardProps) {
  const sharedClassName = `relative overflow-hidden glass-card rounded-lg p-4 sm:p-5 transition-all duration-200 ${
    onClick
      ? 'cursor-pointer hover:shadow-md group text-left w-full tap-target'
      : ''
  }`;

  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[13px] font-medium text-slate-600">{title}</p>
        <p className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-[12px] text-slate-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      <div
        className={`p-2.5 sm:p-3 rounded-lg ${color} shadow-sm bg-opacity-95 transform-gpu group-hover:scale-105 transition-transform`}
      >
        {icon}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={sharedClassName}>
        {content}
      </button>
    );
  }

  return <div className={sharedClassName}>{content}</div>;
}
