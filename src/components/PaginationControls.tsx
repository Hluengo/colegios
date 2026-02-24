import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui';

type PaginationControlsProps = {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

const PaginationControls = React.memo(
  ({
    currentPage,
    pageSize,
    totalCount,
    onPageChange,
    isLoading = false,
  }: PaginationControlsProps) => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const handlePrevious = useCallback(() => {
      if (hasPrevious) onPageChange(currentPage - 1);
    }, [currentPage, hasPrevious, onPageChange]);

    const handleNext = useCallback(() => {
      if (hasNext) onPageChange(currentPage + 1);
    }, [currentPage, hasNext, onPageChange]);

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between py-4 border-t">
        <div className="text-sm text-gray-600">
          Mostrando página <span className="font-semibold">{currentPage}</span>{' '}
          de <span className="font-semibold">{totalPages}</span> ({totalCount}{' '}
          total)
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handlePrevious}
            disabled={!hasPrevious || isLoading}
            variant="outline"
            className="gap-1"
          >
            <ChevronLeft size={16} />
            Anterior
          </Button>

          <div className="flex items-center px-3 text-sm font-medium">
            {currentPage} / {totalPages}
          </div>

          <Button
            onClick={handleNext}
            disabled={!hasNext || isLoading}
            variant="outline"
            className="gap-1"
          >
            Siguiente
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.currentPage === next.currentPage &&
      prev.pageSize === next.pageSize &&
      prev.totalCount === next.totalCount &&
      prev.isLoading === next.isLoading
    );
  },
);

PaginationControls.displayName = 'PaginationControls';

export default PaginationControls;
