import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getConductTypes, getConductCatalog } from '../api/db';
import { logger } from '../utils/logger';
import { useTenant } from './TenantContext';

const ConductCatalogContext = createContext(null);

export function ConductCatalogProvider({ children }) {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const tenantId = tenant?.id || null;
  const [conductTypes, setConductTypes] = useState([]);
  const [catalogRows, setCatalogRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!tenantId) {
      setConductTypes([]);
      setCatalogRows([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [types, catalog] = await Promise.all([
        getConductTypes({ activeOnly: true, tenantId }),
        getConductCatalog({ activeOnly: true, tenantId }),
      ]);
      setConductTypes(types || []);
      setCatalogRows(catalog || []);
    } catch (e) {
      logger.error('Error cargando catálogo de conductas:', e);
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantLoading) return;
    load();
  }, [load, tenantLoading]);

  const value = {
    conductTypes,
    catalogRows,
    loading,
    error,
    refresh: load,
  };

  return (
    <ConductCatalogContext.Provider value={value}>
      {children}
    </ConductCatalogContext.Provider>
  );
}

export function useConductCatalogContext() {
  return useContext(ConductCatalogContext);
}
