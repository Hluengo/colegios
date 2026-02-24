// =====================================================
// Tenant Context
// Provee información del tenant actual y del usuario
// =====================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '../api/supabaseClient';
import type { Tenant, TenantUser } from '../types';
import { logger } from '../utils/logger';

interface TenantContextType {
  tenant: Tenant | null;
  user: TenantUser | null;
  isLoading: boolean;
  isPlatformAdmin: boolean;
  isTenantAdmin: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<TenantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTenantData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener usuario actual
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setTenant(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('tenant_profiles')
        .select('*')
        .eq('id', authUser.id)
        .eq('is_active', true)
        .single();

      if (profileError || !profile) {
        setError(new Error('Perfil no encontrado'));
        setIsLoading(false);
        return;
      }

      const resolvedUser: TenantUser = {
        id: profile.id,
        tenant_id: profile.tenant_id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        avatar_url: profile.avatar_url,
        is_active: profile.is_active,
      };
      setUser(resolvedUser);
      logger.debug('👤 User profile loaded, attempting to load tenant:', { tenant_id: profile.tenant_id });

      // Obtener datos del tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .eq('is_active', true)
        .maybeSingle();

      if (tenantData) {
        setTenant(tenantData);
        return;
      }

      // Fallback para platform_admin cuando su tenant actual fue eliminado/inactivado
      if (profile.role === 'platform_admin') {
        const { data: fallbackTenant, error: fallbackError } = await supabase
          .from('tenants')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (fallbackError) {
          throw fallbackError;
        }

        if (fallbackTenant) {
          setTenant(fallbackTenant);
          setError(null);

          if (fallbackTenant.id !== profile.tenant_id) {
            const { error: updateProfileError } = await supabase
              .from('tenant_profiles')
              .update({
                tenant_id: fallbackTenant.id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id);

            if (updateProfileError) {
              logger.warn(
                'No se pudo actualizar tenant_id fallback para platform_admin:',
                updateProfileError,
              );
            }
          }
          return;
        }

        setTenant(null);
        setError(
          new Error(
            'No hay colegios activos para asignar al administrador de plataforma',
          ),
        );
        return;
      }

      if (tenantError || !tenantData) {
        setError(new Error('Tenant no encontrado o inactivo'));
        setTenant(null);
        return;
      }
    } catch (err) {
      logger.error('Error fetching tenant data:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantData();

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchTenantData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isPlatformAdmin = user?.role === 'platform_admin';
  const isTenantAdmin = user?.role === 'tenant_admin' || isPlatformAdmin;

  return (
    <TenantContext.Provider
      value={{
        tenant,
        user,
        isLoading,
        isPlatformAdmin,
        isTenantAdmin,
        error,
        refetch: fetchTenantData,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// =====================================================
// Hook para obtener catálogos del tenant
// =====================================================

interface UseTenantCatalogsOptions {
  catalogType?: string;
  enabled?: boolean;
}

export function useTenantCatalogs(options: UseTenantCatalogsOptions = {}) {
  const { catalogType, enabled = true } = options;
  const { tenant } = useTenant();
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !tenant) {
      setCatalogs([]);
      return;
    }

    const fetchCatalogs = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('tenant_catalogs')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .order('display_order');

        if (catalogType) {
          query = query.eq('catalog_type', catalogType);
        }

        const { data, error } = await query;

        if (error) throw error;
        setCatalogs(data || []);
      } catch (err) {
        logger.error('Error fetching catalogs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogs();
  }, [tenant, catalogType, enabled]);

  return { catalogs, isLoading };
}
