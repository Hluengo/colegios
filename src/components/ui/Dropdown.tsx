/**
 * Dropdown - Menú desplegable
 * 
 * Dropdowns accesibles con múltiples variantes y posiciones.
 * 
 * @example
 * <Dropdown
 *   trigger={<Button>Menú</Button>}
 *   items={[
 *     { label: 'Editar', onClick: () => {} },
 *     { label: 'Eliminar', variant: 'danger', onClick: () => {} }
 *   ]}
 * />
 */

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownItem {
  id?: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  /** Elemento que dispara el dropdown */
  trigger: ReactNode;
  /** Elementos del menú */
  items: DropdownItem[];
  /** Posición del dropdown */
  align?: 'left' | 'right';
  /** Ancho del dropdown */
  width?: 'auto' | 'full' | number;
  /** Mostrar flecha */
  showArrow?: boolean;
  /** Disabled */
  disabled?: boolean;
}

export function Dropdown({
  trigger,
  items,
  align = 'left',
  width = 'auto',
  showArrow = true,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const widths = {
    auto: 'w-auto',
    full: 'w-full',
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="cursor-pointer flex items-center gap-2"
      >
        {trigger}
        {!disabled && showArrow && (
          <ChevronDown
            className={`w-4 h-4 text-surface-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          className={`
            absolute z-50 mt-2 
            ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}
            ${typeof width === 'number' ? '' : widths[width]}
            bg-white rounded-xl border border-surface-200 shadow-surface-lg
            py-1 min-w-[180px]
            animate-scale-in
          `}
          style={{
            width: typeof width === 'number' ? `${width}px` : undefined,
          }}
          role="menu"
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="h-px bg-surface-100 my-1" />;
            }

            return (
              <button
                key={item.id || index}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                className={`
                  w-full px-4 py-2 text-left text-sm flex items-center gap-3
                  transition-colors duration-150
                  ${
                    item.disabled
                      ? 'text-surface-300 cursor-not-allowed'
                      : item.variant === 'danger'
                      ? 'text-danger-600 hover:bg-danger-50'
                      : 'text-surface-700 hover:bg-surface-50'
                  }
                `}
                role="menuitem"
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * DropdownSelect - Dropdown como select
 */
interface DropdownSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface DropdownSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownSelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export function DropdownSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  label,
  disabled = false,
}: DropdownSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Dropdown
      trigger={
        <div
          className={`
            px-4 py-2.5 rounded-xl border bg-white text-left
            ${disabled ? 'bg-surface-50 text-surface-400' : 'text-surface-900 border-surface-200 hover:border-surface-300'}
            transition-colors duration-200 min-w-[200px]
          `}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.icon && (
                <span className="w-4 h-4">{selectedOption.icon}</span>
              )}
              <span>{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-surface-400">{placeholder}</span>
          )}
        </div>
      }
      items={options.map((opt) => ({
        label: opt.label,
        icon: opt.value === value ? <Check className="w-4 h-4 text-primary-500" /> : opt.icon,
        onClick: () => onChange(opt.value),
      }))}
      disabled={disabled}
    />
  );
}

/**
 * DropdownMenu - Menú con secciones
 */
interface DropdownSection {
  title?: string;
  items: DropdownItem[];
}

interface DropdownMenuProps {
  trigger: ReactNode;
  sections: DropdownSection[];
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, sections, align = 'left' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 
            ${align === 'right' ? 'right-0' : 'left-0'}
            bg-white rounded-xl border border-surface-200 shadow-surface-lg
            py-1 min-w-[200px]
            animate-scale-in
          `}
          role="menu"
        >
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <div className="px-4 py-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              {section.items.map((item, itemIndex) => (
                <button
                  key={item.id || itemIndex}
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-4 py-2 text-left text-sm flex items-center gap-3
                    ${item.disabled ? 'text-surface-300 cursor-not-allowed' : 'text-surface-700 hover:bg-surface-50'}
                  `}
                  role="menuitem"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
