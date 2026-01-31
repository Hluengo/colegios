import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Simple modal shell (no portal). Uses fixed overlay.
 * - ESC closes
 * - Click on backdrop closes
 */
export default function ModalShell({
  title,
  subtitle,
  children,
  onClose,
  footer,
  size = 'xl',
  // Permite que algunos modales (p.ej. CaseDetailModal) dibujen su propio header.
  showHeader = true,
  // Si showHeader=false, este flag no se usa (no se renderiza nada arriba).
  showCloseButton = true,
}) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const maxW =
    size === 'lg'
      ? 'max-w-4xl'
      : size === 'md'
        ? 'max-w-2xl'
        : size === 'sm'
          ? 'max-w-xl'
          : 'max-w-6xl';

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* panel */}
      <div className="relative h-full w-full flex items-start justify-center p-3 sm:p-6 overflow-auto">
        <div
          className={`w-full ${maxW} bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {showHeader ? (
            <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
              <div className="min-w-0">
                {title && (
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2">
                    {subtitle}
                  </p>
                )}
              </div>

              {showCloseButton ? (
                <button
                  onClick={onClose}
                  className="ml-3 p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="max-h-[80vh] overflow-y-auto">{children}</div>

          {footer && (
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
