/**
 * Button - Componente de botón moderno
 * 
 * Sistema de diseño SaaS moderno con variantes, tamaños y estados.
 * 
 * @example
 * <Button variant="primary" size="md" isLoading={false}>
 *   Guardar cambios
 * </Button>
 */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg';
  /** Mostrar estado de carga */
  isLoading?: boolean;
  /** Icono a la izquierda */
  leftIcon?: ReactNode;
  /** Icono a la derecha */
  rightIcon?: ReactNode;
  /** Botón de ancho completo */
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Mapas de estilos
    const variants = {
      primary:
        'bg-primary-500 text-white hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg active:bg-primary-700 active:translate-y-0 focus:ring-primary-500',
      secondary:
        'bg-white text-surface-700 border border-surface-200 hover:bg-surface-50 hover:border-surface-300 hover:-translate-y-0.5 active:bg-surface-100 active:translate-y-0 focus:ring-surface-300',
      ghost:
        'text-surface-600 bg-transparent hover:bg-surface-100 hover:text-surface-900 active:bg-surface-200 focus:ring-surface-300',
      danger:
        'bg-danger-500 text-white hover:bg-danger-600 hover:-translate-y-0.5 hover:shadow-lg active:bg-danger-700 active:translate-y-0 focus:ring-danger-500',
      success:
        'bg-success-500 text-white hover:bg-success-600 hover:-translate-y-0.5 hover:shadow-lg active:bg-success-700 active:translate-y-0 focus:ring-success-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg',
      md: 'px-4 py-2 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl',
    };

    const iconSizes = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center font-semibold
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className={`animate-spin -ml-1 mr-2 ${iconSizes[size]}`}
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
            <span>Cargando...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className={`mr-2 ${iconSizes[size]}`}>{leftIcon}</span>}
            {children}
            {rightIcon && <span className={`ml-2 ${iconSizes[size]}`}>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * IconButton - Botón de solo icono
 */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  label: string; // Accessibility label
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', isLoading = false, label, className = '', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
      secondary: 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50 hover:text-surface-900 focus:ring-surface-300',
      ghost: 'text-surface-500 hover:bg-surface-100 hover:text-surface-900 focus:ring-surface-300',
      danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500',
    };

    const sizes = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    return (
      <button
        ref={ref}
        aria-label={label}
        className={`
          inline-flex items-center justify-center rounded-xl
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <svg className={`animate-spin ${iconSizes[size]}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <span className={iconSizes[size]}>{children}</span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
