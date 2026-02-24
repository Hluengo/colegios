import { useEffect, useRef, useState } from 'react';

/**
 * Hook de caching genérico para datos que cambian infrequentemente
 * Ideal para: catálogos, configuraciones, datos estáticos
 * 
 * @param fetchFn - Función async que obtiene los datos
 * @param key - Clave única para identificar el cache
 * @param ttlMs - Tiempo de vida del cache en milisegundos (default: 5 minutos)
 * 
 * Ejemplo:
 * const { data, loading, error, refresh } = useCache(
 *   () => getActionTypes(),
 *   'action_types',
 *   300000 // 5 minutos
 * );
 */
export function useCache<T>(
  fetchFn: () => Promise<T>,
  key: string,
  ttlMs: number = 300000, // 5 minutos por defecto
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<{
    data: T | null;
    timestamp: number;
  } | null>(null);

  // Cache global para reutilizar entre componentes
  if (!globalThis.__cacheStore) {
    globalThis.__cacheStore = new Map<
      string,
      { data: any; timestamp: number }
    >();
  }
  const globalCache = globalThis.__cacheStore as Map<
    string,
    { data: any; timestamp: number }
  >;

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      
      // Actualizar cache global
      globalCache.set(key, { data: result, timestamp: Date.now() });
      cacheRef.current = { data: result, timestamp: Date.now() };
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verificar si hay cache válido
    const cached = globalCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttlMs) {
      // Usar cache
      setData(cached.data);
      setLoading(false);
      return;
    }

    // Cache expirado o no existe, buscar datos nuevos
    refresh();
  }, [key, ttlMs]);

  return { data, loading, error, refresh };
}

/**
 * Limpia el cache global (útil en tests o logout)
 */
export function clearCache(pattern?: string) {
  if (!globalThis.__cacheStore) return;
  
  const cache = globalThis.__cacheStore as Map<string, any>;
  if (!pattern) {
    cache.clear();
  } else {
    // Limpiar keys que coincidan con el patrón
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  }
}

declare global {
  var __cacheStore: Map<string, { data: any; timestamp: number }> | undefined;
}
