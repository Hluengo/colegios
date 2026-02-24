/**
 * Avatar - Componente de avatar de usuario
 *
 * Avatares con imágenes, iniciales, estados y grupos.
 *
 * @example
 * <Avatar src="/img.jpg" name="Juan Pérez" />
 * <AvatarGroup>
 *   <Avatar name="Juan" />
 *   <Avatar name="María" />
 * </AvatarGroup>
 */

import { Children, isValidElement, useMemo, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** URL de la imagen */
  src?: string;
  /** Nombre para mostrar (genera iniciales) */
  name?: string;
  /** Tamaño del avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Estado del usuario */
  status?: 'online' | 'offline' | 'busy' | 'away';
  /** Mostrar borde */
  bordered?: boolean;
  /** Variante de color de fondo */
  color?: string;
}

export function Avatar({
  src,
  name,
  size = 'md',
  status,
  bordered = false,
  color,
  className = '',
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Generar iniciales del nombre
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generar color desde el nombre
  const getColorFromName = (name: string) => {
    const colors = [
      'bg-primary-500',
      'bg-success-500',
      'bg-warning-500',
      'bg-danger-500',
      'bg-info-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
    '2xl': 'h-20 w-20 text-xl',
  };

  const statusSizes = {
    xs: 'h-1.5 w-1.5 border',
    sm: 'h-2 w-2 border',
    md: 'h-2.5 w-2.5 border-2',
    lg: 'h-3 w-3 border-2',
    xl: 'h-4 w-4 border-2',
    '2xl': 'h-5 w-5 border-[3px]',
  };

  const statusColors = {
    online: 'bg-success-500',
    offline: 'bg-surface-400',
    busy: 'bg-danger-500',
    away: 'bg-warning-500',
  };

  const showFallback = !src || imgError;
  const bgColor = color || (name ? getColorFromName(name) : 'bg-surface-500');

  return (
    <div
      className={`
        relative inline-flex items-center justify-center rounded-full
        overflow-hidden flex-shrink-0
        ${sizes[size]}
        ${bordered ? 'border-2 border-white shadow-sm' : ''}
        ${className}
      `}
      {...props}
    >
      {showFallback ? (
        <span
          className={`${bgColor} text-white font-semibold flex items-center justify-center w-full h-full`}
        >
          {name ? getInitials(name) : '?'}
        </span>
      ) : (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}

      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full ${statusSizes[size]} border-white
            ${statusColors[status]}
          `}
          aria-label={`Estado: ${status}`}
        />
      )}
    </div>
  );
}

/**
 * AvatarGroup - Grupo de avatares solapados
 */
interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarGroup({
  children,
  max = 4,
  size = 'md',
}: AvatarGroupProps) {
  const childArray = useMemo(
    () => Children.toArray(children).filter(Boolean),
    [children],
  );
  const visibleAvatars = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  const overlapSizes = {
    xs: '-ml-2',
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
    xl: '-ml-5',
  };

  return (
    <div className="flex items-center">
      {visibleAvatars.map((child, index) => (
        <div
          key={
            isValidElement(child) && child.key
              ? String(child.key)
              : `avatar-${index}`
          }
          className={`${index > 0 ? overlapSizes[size] : ''} ring-2 ring-white rounded-full`}
        >
          {child}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={`
            ${overlapSizes[size]}
            ${size === 'xs' ? 'h-6 w-6 text-xs' : ''}
            ${size === 'sm' ? 'h-8 w-8 text-xs' : ''}
            ${size === 'md' ? 'h-10 w-10 text-sm' : ''}
            ${size === 'lg' ? 'h-12 w-12 text-base' : ''}
            ${size === 'xl' ? 'h-16 w-16 text-lg' : ''}
          `}
        >
          <Avatar
            name={`+${remainingCount}`}
            size={size}
            color="bg-surface-300"
            className="text-surface-800"
          />
        </div>
      )}
    </div>
  );
}

/**
 * AvatarWithTooltip - Avatar con tooltip
 */
interface AvatarWithTooltipProps extends AvatarProps {
  showTooltip?: boolean;
}

export function AvatarWithTooltip({
  showTooltip = true,
  name,
  ...props
}: AvatarWithTooltipProps) {
  return (
    <div className="relative group inline-block">
      <Avatar name={name} {...props} />
      {showTooltip && name && (
        <div
          className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          px-2 py-1 bg-surface-900 text-white text-xs rounded-lg
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 whitespace-nowrap
          pointer-events-none z-10
        "
        >
          {name}
          <div
            className="
            absolute top-full left-1/2 -translate-x-1/2
            border-4 border-transparent border-t-surface-900
          "
          />
        </div>
      )}
    </div>
  );
}
