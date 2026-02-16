/**
 * RequireAuth - Componente de protección de rutas
 * 
 * Verifica que el usuario esté autenticado antes de permitir acceso
 * a rutas protegidas. Redirige a /login si no hay sesión válida.
 * 
 * @component
 * @example
 * <RequireAuth>
 *   <Dashboard />
 * </RequireAuth>
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import type { ReactNode } from 'react';

// PageLoader inline para evitar dependencia circular
function AuthPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>
  );
}

interface RequireAuthProps {
  /** Componentes hijos a renderizar si está autenticado */
  children: ReactNode;
  /** Ruta a redireccionar si no está autenticado (default: /login) */
  redirectTo?: string;
  /** Invierte la validación: si hay sesión, redirige (útil en /login) */
  invert?: boolean;
}

/**
 * Hook interno para obtener estado de autenticación
 */
function useAuthState() {
  const { user, isLoading, error } = useTenant();
  return { user, isLoading, error };
}

/**
 * Componente de protección de rutas
 * 
 * Maneja tres estados:
 * - loading: Muestra spinner mientras verifica autenticación
 * - authenticated: Renderiza children
 * - not authenticated: Redirige a login
 */
export function RequireAuth({ 
  children, 
  redirectTo = '/login',
  invert = false,
}: RequireAuthProps) {
  const location = useLocation();
  const { user, isLoading, error } = useAuthState();

  // Estado de carga: verificar sesión
  if (isLoading) {
    return <AuthPageLoader />;
  }

  // Ruta invertida (ej. login): si ya hay sesión, redirigir.
  if (invert) {
    if (user) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{children}</>;
  }

  // Error de autenticación: redirigir a login
  if (error || !user) {
    return (
      <Navigate
        to={redirectTo}
        state={{
          from: location.pathname,
          reason: error?.message,
        }}
        replace
      />
    );
  }

  // Usuario autenticado: renderizar contenido protegido
  return <>{children}</>;
}

/**
 * Componente para mostrar contenido según rol de usuario
 * 
 * @example
 * <RequireRole roles={['platform_admin', 'tenant_admin']}>
 *   <AdminPanel />
 * </RequireRole>
 */
interface RequireRoleProps {
  children: ReactNode;
  /** Roles permitidos para ver el contenido */
  roles: Array<'platform_admin' | 'tenant_admin' | 'user' | 'readonly'>;
  /** Componente a mostrar si no tiene permisos (opcional) */
  fallback?: ReactNode;
}

export function RequireRole({ 
  children, 
  roles, 
  fallback = null 
}: RequireRoleProps) {
  const { user, isLoading } = useTenant();

  if (isLoading) {
    return <AuthPageLoader />;
  }

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook para verificar permisos programáticamente
 * 
 * @example
 * const { canAccess, isAdmin } = useAuthPermissions();
 * if (!canAccess(['platform_admin'])) return <NotAuthorized />;
 */
export function useAuthPermissions() {
  const { user, isPlatformAdmin, isTenantAdmin } = useTenant();

  const canAccess = (allowedRoles: string[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const isAdmin = isPlatformAdmin || isTenantAdmin;

  return {
    user,
    isAdmin,
    canAccess,
    isPlatformAdmin,
    isTenantAdmin,
  };
}
