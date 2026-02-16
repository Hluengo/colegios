/**
 * Modal - Componente de diálogo moderno
 * 
 * Modales accesibles con animación, close button y múltiples tamaños.
 * 
 * @example
 * <Modal isOpen={true} onClose={() => setOpen(false)} title="Editar perfil">
 *   <p>Contenido del modal</p>
 * </Modal>
 */

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  /** Control de visibilidad */
  isOpen: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Título del modal */
  title?: string;
  /** children */
  children: ReactNode;
  /** Tamaño del modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Mostrar botón de cerrar */
  showCloseButton?: boolean;
  /** Cerrar al hacer click fuera */
  closeOnOverlayClick?: boolean;
  /** Cerrar con ESC */
  closeOnEscape?: boolean;
  /** Footer con acciones */
  footer?: ReactNode;
  /** Clases adicionales */
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevenir scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Enfocar el modal al abrir
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`
          relative w-full ${sizes[size]} bg-white rounded-2xl shadow-surface-xl
          animate-scale-in focus:outline-none
          max-h-[90vh] flex flex-col
          ${className}
        `}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            {title && (
              <h2 id={titleId} className="text-lg font-semibold text-surface-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -m-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-surface-100 bg-surface-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/**
 * ConfirmDialog - Diálogo de confirmación
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  const buttonVariants = {
    danger: 'bg-danger-500 hover:bg-danger-600 text-white',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white',
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-surface-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="btn-secondary px-4 py-2"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`btn px-4 py-2 ${buttonVariants[variant]}`}
        >
          {isLoading ? 'Cargando...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Drawer - Panel lateral (alternativa al modal)
 */
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  /** Cerrar al hacer click fuera */
  closeOnOverlayClick?: boolean;
  /** Cerrar con ESC */
  closeOnEscape?: boolean;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevenir scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Enfocar el drawer al abrir
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const positions = {
    left: 'inset-y-0 left-0',
    right: 'inset-y-0 right-0',
  };

  const animations = {
    left: 'animate-slide-right',
    right: 'animate-slide-left',
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`
          absolute ${positions[position]} ${sizes[size]} w-full
          bg-white shadow-surface-xl
          flex flex-col
          ${animations[position]}
          focus:outline-none
        `}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          {title && (
            <h2 id={titleId} className="text-lg font-semibold text-surface-900">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-2 -m-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
