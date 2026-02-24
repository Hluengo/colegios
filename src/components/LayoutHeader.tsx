import React, { memo, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

type LayoutHeaderProps = {
  online: boolean;
  sbOk: boolean;
  mobileSidebarOpen: boolean;
  onMobileSidebarToggle: () => void;
};

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/casos-activos')) return 'Casos Activos';
  if (pathname.startsWith('/seguimientos')) return 'Seguimientos';
  if (pathname.startsWith('/casos-cerrados')) return 'Casos Cerrados';
  if (pathname.startsWith('/admin')) return 'Administración';
  if (pathname.startsWith('/estudiantes')) return 'Estudiantes';
  if (pathname.startsWith('/estadisticas')) return 'Estadísticas';
  if (pathname.startsWith('/alertas')) return 'Alertas y Plazos';
  if (pathname === '/') return 'Inicio';
  return 'Convivencia Escolar';
};

const LayoutHeader = memo(
  ({
    online,
    sbOk,
    mobileSidebarOpen,
    onMobileSidebarToggle,
  }: LayoutHeaderProps) => {
    const location = useLocation();
    const title = getPageTitle(location.pathname);

    const handleToggle = useCallback(() => {
      onMobileSidebarToggle();
    }, [onMobileSidebarToggle]);

    return (
      <div className="flex justify-between items-center px-3 sm:px-5 py-3 shrink-0 border-b border-white/40">
        <button
          type="button"
          onClick={handleToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-white/60 text-slate-600 tap-target"
          aria-label={mobileSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <Menu size={20} />
        </button>

        <div className="flex-1 flex items-center gap-3">
          <h2 className="page-title">{title}</h2>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {online && sbOk ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700">
                Sistema Activo
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 border border-red-100">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-bold text-red-700">
                Desconectado
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.online === next.online &&
      prev.sbOk === next.sbOk &&
      prev.mobileSidebarOpen === next.mobileSidebarOpen
    );
  },
);

LayoutHeader.displayName = 'LayoutHeader';

export default LayoutHeader;
