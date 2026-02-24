import { useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';
import { logger } from '../utils/logger';
import { useTenant } from '../context/TenantContext';
import { useCache } from './useCache';

/**
 * Hook para obtener los tipos de acciones desde Supabase
 * ✨ Con caching: Los datos se cachean por 30 minutos
 * Útil para el catálogo dinámico en formularios de seguimiento
 */
export default function useActionTypes() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const tenantId = tenant?.id;
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  // useCache: reutiliza datos entre componentes por 30 minutos
  const { data: cachedTypes, loading: typeLoading } = useCache(
    async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('action_types')
          .select('id, label, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (fetchError) {
          logger.warn('Error fetching action_types:', fetchError);
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('Error in useActionTypes fetch:', err);
        return [];
      }
    },
    `action_types_${tenantId || 'global'}`,
    1800000, // 30 minutos - action_types cambian infrequentemente
  );

  useEffect(() => {
    // No buscar hasta que tengamos tenantId
    if (!tenantId) {
      setLoading(tenantLoading);
      return;
    }

    const finalLoading = typeLoading || tenantLoading;
    setLoading(finalLoading);

    if (cachedTypes && cachedTypes.length > 0) {
      setActions(cachedTypes.map((d: any) => d.label));
    } else if (!finalLoading) {
      // Si no hay datos después de cargar, usar defaults
      logger.debug('No action_types found, using defaults');
      setActions([
        'Entrevista',
        'Notificación',
        'Recopilación',
        'Medida',
        'Indagacion',
        'Resolucion',
        'Apelacion',
        'Monitoreo',
      ]);
    }
  }, [tenantId, tenantLoading, cachedTypes, typeLoading]);

  return { actions, loading };
}
