/**
 * Input - Componentes de formulario modernos
 * 
 * Inputs, selects y textareas con validación, labels flotantes y estados.
 * 
 * @example
 * <Input label="Email" type="email" error="Email inválido" />
 * <Select label="País" options={[]} />
 */

import { forwardRef, useId } from 'react';
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';

// ==========================================
// INPUT
// ==========================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta del campo */
  label?: string;
  /** Texto de ayuda */
  hint?: string;
  /** Mensaje de error */
  error?: string;
  /** Estado de éxito */
  success?: boolean;
  /** Icono a la izquierda */
  leftIcon?: ReactNode;
  /** Icono a la derecha */
  rightIcon?: ReactNode;
  /** Input de ancho completo */
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      success,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    
    const inputStyles = error
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
      : success
      ? 'border-success-300 focus:border-success-500 focus:ring-success-100'
      : 'border-surface-200 focus:border-primary-500 focus:ring-primary-100';

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-2.5 text-surface-900 bg-white
              rounded-xl border transition-all duration-200
              placeholder:text-surface-400
              focus:outline-none focus:ring-2
              disabled:bg-surface-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${inputStyles}
              ${className}
            `}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}
        {hint && !error && <p className="form-hint">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ==========================================
// TEXTAREA
// ==========================================

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: boolean;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, success, fullWidth = true, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `textarea-${generatedId}`;
    
    const inputStyles = error
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
      : success
      ? 'border-success-300 focus:border-success-500 focus:ring-success-100'
      : 'border-surface-200 focus:border-primary-500 focus:ring-primary-100';

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2.5 text-surface-900 bg-white
            rounded-xl border transition-all duration-200
            placeholder:text-surface-400
            focus:outline-none focus:ring-2
            disabled:bg-surface-50 disabled:cursor-not-allowed
            resize-none
            ${inputStyles}
            ${className}
          `}
          {...props}
        />

        {error && <p className="form-error">{error}</p>}
        {hint && !error && <p className="form-hint">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ==========================================
// SELECT
// ==========================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  hint?: string;
  error?: string;
  success?: boolean;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, success, options, placeholder, fullWidth = true, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `select-${generatedId}`;
    
    const inputStyles = error
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
      : success
      ? 'border-success-300 focus:border-success-500 focus:ring-success-100'
      : 'border-surface-200 focus:border-primary-500 focus:ring-primary-100';

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-2.5 text-surface-900 bg-white
              rounded-xl border transition-all duration-200
              focus:outline-none focus:ring-2
              disabled:bg-surface-50 disabled:cursor-not-allowed
              appearance-none cursor-pointer
              ${inputStyles}
              ${className}
            `}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="form-error">{error}</p>}
        {hint && !error && <p className="form-hint">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ==========================================
// CHECKBOX & RADIO
// ==========================================

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `checkbox-${generatedId}`;

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className={`
            h-5 w-5 rounded border-surface-300
            text-primary-600 focus:ring-primary-500 focus:ring-offset-2
            ${className}
          `}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label htmlFor={inputId} className="text-sm font-medium text-surface-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <span className="text-sm text-surface-500">{description}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `radio-${generatedId}`;

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="radio"
          id={inputId}
          className={`
            h-5 w-5 border-surface-300
            text-primary-600 focus:ring-primary-500 focus:ring-offset-2
            ${className}
          `}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label htmlFor={inputId} className="text-sm font-medium text-surface-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <span className="text-sm text-surface-500">{description}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

// ==========================================
// INPUT GROUP
// ==========================================

interface InputGroupProps {
  children: ReactNode;
  label?: string;
  error?: string;
}

export function InputGroup({ children, label, error }: InputGroupProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
