type PageHeaderProps = {
  title: string;
  subtitle?: string;
  badgeText?: string;
  actions?: React.ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  subtitle,
  badgeText,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 mb-4 ${className}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-[1.375rem] font-semibold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {badgeText ? (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
              {badgeText}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            {subtitle}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex items-center gap-2 w-full sm:w-auto">{actions}</div>
      ) : null}
    </div>
  );
}
