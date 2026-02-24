/**
 * Utilities - Componentes utilitarios finales
 *
 * Empty states, dividers, wrappers y utilities diversas.
 */

import { ReactNode } from 'react';
import { FolderOpen } from 'lucide-react';

// ==========================================
// EMPTY STATE
// ==========================================

interface EmptyStateProps {
  /** Icono a mostrar */
  icon?: ReactNode;
  /** Título del estado vacío */
  title: string;
  /** Descripción opcional */
  description?: string;
  /** Acción (botón) */
  action?: ReactNode;
  /** Clase adicional */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action}
    </div>
  );
}

/**
 * EmptyStateSimple - Versión simple pre-configurada
 */
export function EmptyStateSimple({ className = '' }: { className?: string }) {
  return (
    <EmptyState
      icon={<FolderOpen className="w-16 h-16" />}
      title="No hay elementos"
      description="No se encontraron elementos para mostrar."
      className={className}
    />
  );
}

// ==========================================
// DIVIDER
// ==========================================

interface DividerProps {
  /** Texto opcional en el centro */
  label?: string;
  /** Orientación */
  orientation?: 'horizontal' | 'vertical';
  /** Clase adicional */
  className?: string;
}

export function Divider({
  label,
  orientation = 'horizontal',
  className = '',
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={`h-full w-px bg-surface-200 ${className}`}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-surface-200" />
        <span className="text-sm text-surface-500">{label}</span>
        <div className="flex-1 h-px bg-surface-200" />
      </div>
    );
  }

  return (
    <div className={`h-px bg-surface-200 ${className}`} role="separator" />
  );
}

// ==========================================
// WRAPPERS
// ==========================================

interface CardWrapperProps {
  children: ReactNode;
  /** Padding interno */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function CardWrapper({
  children,
  padding = 'md',
  className = '',
  onClick,
}: CardWrapperProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  if (onClick) {
    return (
      <button
        type="button"
        className={`card ${paddings[padding]} cursor-pointer hover:shadow-lg text-left w-full tap-target ${className}`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`card ${paddings[padding]} ${className}`}>{children}</div>
  );
}

// ==========================================
// RESPONSIVE
// ==========================================

interface ShowProps {
  when: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: ReactNode;
}

export function Show({ when, children }: ShowProps) {
  const breakpoints = {
    xs: 'block sm:hidden',
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block',
    '2xl': 'hidden 2xl:block',
  };

  return <div className={breakpoints[when]}>{children}</div>;
}

interface HideProps {
  when: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: ReactNode;
}

export function Hide({ when, children }: HideProps) {
  const breakpoints = {
    xs: 'hidden',
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden',
    xl: 'xl:hidden',
    '2xl': 'hidden',
  };

  return <div className={breakpoints[when]}>{children}</div>;
}

// ==========================================
// TEXT
// ==========================================

interface TextProps {
  children: ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption';
  color?: 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Text({
  children,
  variant = 'body',
  color = 'primary',
  className = '',
}: TextProps) {
  const variants = {
    h1: 'text-4xl font-bold tracking-tight',
    h2: 'text-3xl font-bold tracking-tight',
    h3: 'text-2xl font-semibold',
    h4: 'text-xl font-semibold',
    body: 'text-base',
    small: 'text-sm',
    caption: 'text-xs',
  };

  const colors = {
    primary: 'text-surface-900',
    secondary: 'text-surface-600',
    muted: 'text-surface-400',
    success: 'text-success-600',
    warning: 'text-warning-600',
    danger: 'text-danger-600',
  };

  return (
    <span className={`${variants[variant]} ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}

// ==========================================
// FLEX & GRID
// ==========================================

interface FlexProps {
  children: ReactNode;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: number | string;
  wrap?: boolean;
  className?: string;
}

export function Flex({
  children,
  direction = 'row',
  justify = 'start',
  align = 'start',
  gap,
  wrap = false,
  className = '',
}: FlexProps) {
  const directions = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse',
  };

  const justifies = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const aligns = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  };

  return (
    <div
      className={`
        flex ${directions[direction]} ${justifies[justify]} ${aligns[align]}
        ${wrap ? 'flex-wrap' : ''}
        ${className}
      `}
      style={
        gap !== undefined
          ? { gap: typeof gap === 'number' ? `${gap * 0.25}rem` : gap }
          : undefined
      }
    >
      {children}
    </div>
  );
}

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  gap?: number;
  className?: string;
}

export function Grid({
  children,
  cols = 3,
  gap = 4,
  className = '',
}: GridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12',
  } as const;

  return (
    <div
      className={`grid ${colClasses[cols]} ${className}`}
      style={{ gap: `${gap * 0.25}rem` }}
    >
      {children}
    </div>
  );
}

// ==========================================
// SPACING
// ==========================================

interface SpacerProps {
  size?: number | string;
}

export function Spacer({ size = 4 }: SpacerProps) {
  return (
    <div
      style={{ height: typeof size === 'number' ? `${size * 0.25}rem` : size }}
    />
  );
}

interface VStackProps {
  children: ReactNode;
  gap?: number;
  className?: string;
}

export function VStack({ children, gap = 4, className = '' }: VStackProps) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{ gap: `${gap * 0.25}rem` }}
    >
      {children}
    </div>
  );
}

interface HStackProps {
  children: ReactNode;
  gap?: number;
  className?: string;
}

export function HStack({ children, gap = 4, className = '' }: HStackProps) {
  return (
    <div className={`flex ${className}`} style={{ gap: `${gap * 0.25}rem` }}>
      {children}
    </div>
  );
}

// ==========================================
// VISUALLY HIDDEN (Accesibilidad)
// ==========================================

interface VisuallyHiddenProps {
  children: ReactNode;
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className="sr-only">{children}</span>;
}
