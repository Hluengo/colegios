/**
 * Skeleton - Componentes de carga esqueleto
 * 
 * Estados de carga con efecto shimmer para mejor UX.
 * 
 * @example
 * <Skeleton variant="text" width="100%" />
 * <Skeleton variant="circle" size="lg" />
 */

import type { CSSProperties } from 'react';

interface SkeletonProps {
  /** Variante del skeleton */
  variant?: 'text' | 'circle' | 'rect' | 'card';
  /** Ancho personalizado */
  width?: string | number;
  /** Alto personalizado */
  height?: string | number;
  /** Tamaño predefinido para círculos */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Clases adicionales */
  className?: string;
  /** Mostrar efecto shimmer */
  shimmer?: boolean;
}

/**
 * Skeleton base con variantes
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  size,
  className = '',
  shimmer = true,
}: SkeletonProps) {
  // Estilos por variante
  const variants = {
    text: 'rounded-lg',
    circle: 'rounded-full',
    rect: 'rounded-xl',
    card: 'rounded-2xl',
  };

  // Tamaños predefinidos para círculos
  const circleSizes: Record<string, string> = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  // Alturas predefinidas para texto
  const textSizes: Record<string, string> = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5',
    xl: 'h-6',
  };

  // Determinar dimensiones y clases
  let customStyles: CSSProperties = {};
  let sizeClasses = '';

  if (variant === 'circle' && size) {
    sizeClasses = circleSizes[size] || circleSizes.md;
  } else if (variant === 'text' && size) {
    sizeClasses = textSizes[size] || textSizes.md;
  } else {
    // Solo aplicar estilos personalizados si no hay size predefinido
    if (width !== undefined) {
      customStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height !== undefined) {
      customStyles.height = typeof height === 'number' ? `${height}px` : height;
    }
  }

  return (
    <div
      className={`
        bg-surface-200
        ${shimmer ? 'skeleton-shimmer' : 'animate-pulse'}
        ${variants[variant]}
        ${sizeClasses}
        ${className}
      `}
      style={customStyles}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton de texto con líneas múltiples
 */
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton de tarjeta
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-4 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" size="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

/**
 * Skeleton de tabla
 */
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}: SkeletonTableProps) {
  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton variant="text" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}>
                  <Skeleton 
                    variant="text" 
                    width={colIndex === 0 ? '90%' : '70%'} 
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Skeleton de avatar con texto
 */
export function SkeletonAvatar({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Skeleton variant="circle" size="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="60%" />
      </div>
    </div>
  );
}

/**
 * Skeleton de lista
 */
interface SkeletonListProps {
  items?: number;
}

export function SkeletonList({ items = 5 }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonAvatar key={i} />
      ))}
    </div>
  );
}

/**
 * Loading spinner alternativo
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <svg
      className={`animate-spin text-primary-500 ${sizes[size]}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Loading overlay completo
 */
export function LoadingOverlay({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="loading-overlay">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        {message && <span className="text-surface-500 text-sm">{message}</span>}
      </div>
    </div>
  );
}
