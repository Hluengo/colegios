import { useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';
import { logger } from '../utils/logger';
import { useTenant } from '../context/TenantContext';

/**
 * Hook para obtener los tipos de acciones desde Supabase
 * Útil para el catálogo dinámico en formularios de seguimiento
 */
export default function useActionTypes() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const tenantId = tenant?.id;
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No buscar hasta que tengamos tenantId
    if (!tenantId) {
      setLoading(tenantLoading);
      return;
    }

    let cancelled = false;

    async function fetch() {
      try {
        const { data, error: fetchError } = await supabase
          .from('action_types')
          .select('label, sort_order')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (cancelled) return;

        if (fetchError) {
          logger.warn(
            'Error fetching action_types, falling back to defaults:',
            fetchError,
          );
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
        } else if (data && data.length > 0) {
          setActions(data.map((d) => d.label));
        } else {
          // Si no hay acción_types para este tenant, usar defaults
          logger.debug('No action_types found for tenant, using defaults');
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
      } catch (err) {
        if (cancelled) return;
        logger.warn('Error in useActionTypes:', err);
        // Fallback to defaults
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
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetch();

    return () => {
      cancelled = true;
    };
  }, [tenantId, tenantLoading]);

  return { actions, loading };
}
