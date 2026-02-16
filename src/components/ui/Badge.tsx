/**
 * Badge - Componente de etiqueta/estado
 * 
 * Sistema de badges con variantes de color y estilos.
 * 
 * @example
 * <Badge variant="primary">Activo</Badge>
 * <Badge variant="success" size="lg">Completado</Badge>
 */

import { forwardRef, HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Variante de color */
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  /** Tamaño del badge */
  size?: 'sm' | 'md' | 'lg';
  /** Badge con punto indicador */
  dot?: boolean;
  /** Badge sólido (sin fondo) */
  outline?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'neutral',
      size = 'md',
      dot = false,
      outline = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Mapas de estilos
    const variants = {
      primary: {
        solid: 'bg-primary-100 text-primary-700 border-primary-200',
        outline: 'bg-transparent text-primary-600 border-primary-300',
        dot: 'bg-primary-500',
      },
      success: {
        solid: 'bg-success-100 text-success-700 border-success-200',
        outline: 'bg-transparent text-success-600 border-success-300',
        dot: 'bg-success-500',
      },
      warning: {
        solid: 'bg-warning-100 text-warning-700 border-warning-200',
        outline: 'bg-transparent text-warning-600 border-warning-300',
        dot: 'bg-warning-500',
      },
      danger: {
        solid: 'bg-danger-100 text-danger-700 border-danger-200',
        outline: 'bg-transparent text-danger-600 border-danger-300',
        dot: 'bg-danger-500',
      },
      info: {
        solid: 'bg-info-100 text-info-700 border-info-200',
        outline: 'bg-transparent text-info-600 border-info-300',
        dot: 'bg-info-500',
      },
      neutral: {
        solid: 'bg-surface-100 text-surface-600 border-surface-200',
        outline: 'bg-transparent text-surface-600 border-surface-300',
        dot: 'bg-surface-500',
      },
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5 font-medium rounded-full border
          ${outline ? variants[variant].outline : variants[variant].solid}
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${variants[variant].dot}`}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * StatusBadge - Badge con indicador de estado
 */
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'pending' | 'error';
  label?: string;
  showLabel?: boolean;
}

export function StatusBadge({ status, label, showLabel = true }: StatusBadgeProps) {
  const statusConfig = {
    online: { variant: 'success' as const, dotColor: 'bg-success-500', label: 'En línea' },
    offline: { variant: 'neutral' as const, dotColor: 'bg-surface-400', label: 'Desconectado' },
    busy: { variant: 'danger' as const, dotColor: 'bg-danger-500', label: 'Ocupado' },
    away: { variant: 'warning' as const, dotColor: 'bg-warning-500', label: 'Ausente' },
    pending: { variant: 'info' as const, dotColor: 'bg-info-500', label: 'Pendiente' },
    error: { variant: 'danger' as const, dotColor: 'bg-danger-500', label: 'Error' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} dot>
      {showLabel && (label || config.label)}
    </Badge>
  );
}
