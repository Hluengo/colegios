import React, { useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Input, Select, Button } from './ui';

type CaseListHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  estadoFiltro?: string;
  onEstadoChange?: (value: string) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  onNewClick?: () => void;
  filterOptions?: Array<{ label: string; value: string }>;
};

const CaseListHeader = React.memo(
  ({
    search,
    onSearchChange,
    estadoFiltro = 'Todos',
    onEstadoChange,
    pageSize = 10,
    onPageSizeChange,
    onNewClick,
    filterOptions = [],
  }: CaseListHeaderProps) => {
    const handleClearSearch = useCallback(() => {
      onSearchChange('');
    }, [onSearchChange]);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Casos</h1>
          {onNewClick && (
            <Button onClick={onNewClick} className="gap-2">
              <Plus size={16} />
              Nuevo Caso
            </Button>
          )}
        </div>

        <div className="flex gap-3 flex-col sm:flex-row">
          <Input
            type="text"
            placeholder="Buscar estudiante, conductor, ID…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="text-gray-500 hover:text-gray-700 p-2"
              title="Limpiar búsqueda"
            >
              <X size={20} />
            </button>
          )}

          {filterOptions.length > 0 && onEstadoChange && (
            <Select
              value={estadoFiltro}
              onChange={(e) => onEstadoChange(e.target.value)}
              options={filterOptions}
              className="w-40"
            />
          )}

          {onPageSizeChange && (
            <Select
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              options={[
                { label: '5 por página', value: '5' },
                { label: '10 por página', value: '10' },
                { label: '20 por página', value: '20' },
                { label: '50 por página', value: '50' },
              ]}
              className="w-32"
            />
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.search === next.search &&
      prev.estadoFiltro === next.estadoFiltro &&
      prev.pageSize === next.pageSize
    );
  },
);

CaseListHeader.displayName = 'CaseListHeader';

export default CaseListHeader;
