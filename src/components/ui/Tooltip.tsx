/**
 * Tooltip - Información contextual
 *
 * Tooltips accesibles con múltiples posiciones y variantes.
 *
 * @example
 * <Tooltip content="Información adicional" position="top">
 *   <Button>Hover me</Button>
 * </Tooltip>
 */

import { useState, useRef, useId, ReactNode } from 'react';

interface TooltipProps {
  /** Contenido del tooltip */
  content: ReactNode;
  /** Elemento que muestra el tooltip */
  children: ReactNode;
  /** Posición del tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Variante de color */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  /** Delay en ms para mostrar */
  delay?: number;
  /** Disabled el tooltip */
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  variant = 'default',
  delay = 200,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  const handleMouseEnter = showTooltip;
  const handleMouseLeave = hideTooltip;
  const handleFocus = showTooltip;
  const handleBlur = hideTooltip;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const animations = {
    top: 'animate-slide-down',
    bottom: 'animate-slide-up',
    left: 'animate-slide-right',
    right: 'animate-slide-left',
  };

  const variants = {
    default: 'bg-surface-900 text-white',
    primary: 'bg-primary-600 text-white',
    success: 'bg-success-600 text-white',
    warning: 'bg-warning-600 text-white',
    danger: 'bg-danger-600 text-white',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-surface-900 border-x-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-b-surface-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-surface-900 border-y-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 border-r-surface-900 border-y-transparent border-l-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}

      {isVisible && !disabled && (
        <div
          id={tooltipId}
          className={`
            absolute z-50 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap
            ${positions[position]}
            ${variants[variant]}
            ${animations[position]}
          `}
          role="tooltip"
        >
          {content}
          <div
            className={`
              absolute w-0 h-0 border-4
              ${arrows[position]}
            `}
          />
        </div>
      )}
    </div>
  );
}

/**
 * TooltipWithIcon - Tooltip con icono de información
 */
interface TooltipWithIconProps {
  content: ReactNode;
  icon?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function TooltipWithIcon({
  content,
  icon,
  position = 'top',
}: TooltipWithIconProps) {
  const IconComponent = icon || (
    <svg
      className="w-4 h-4 text-surface-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <Tooltip content={content} position={position}>
      <span className="inline-flex cursor-help">{IconComponent}</span>
    </Tooltip>
  );
}

/**
 * RichTooltip - Tooltip con contenido enriquecido
 */
interface RichTooltipProps {
  /** Contenido principal */
  title: string;
  /** Descripción */
  description?: ReactNode;
  /** Footer con acciones */
  footer?: ReactNode;
  /** Elemento trigger */
  children: ReactNode;
  /** Posición */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function RichTooltip({
  title,
  description,
  footer,
  children,
  position = 'top',
}: RichTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div
          className={`
            absolute z-50 w-64 p-3
            bg-white rounded-xl border border-surface-200 shadow-surface-lg
            ${positions[position]}
            animate-scale-in
          `}
          role="tooltip"
        >
          <p className="font-semibold text-surface-900 text-sm">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-surface-600">{description}</p>
          )}
          {footer && (
            <div className="mt-2 pt-2 border-t border-surface-100">
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
