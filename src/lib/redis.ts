// =====================================================
// Cliente Redis para caché distribuido
// Uso: Almacenar datos frecuentemente accedidos por tenant
// =====================================================

// Nota: Esta implementación es para el lado del cliente
// La caché real se maneja en las Edge Functions

interface CacheOptions {
  ttl?: number; // Time to live en segundos
  prefix?: string;
}

interface CacheClient {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  del(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

// Estrategias de caché por tipo de dato
export const CACHE_STRATEGIES = {
  tenant_stats: { ttl: 300, prefix: 'tenant:stats:' }, // 5 min
  catalogs: { ttl: 3600, prefix: 'tenant:catalogs:' }, // 1 hora
  settings: { ttl: 600, prefix: 'tenant:settings:' }, // 10 min
  users: { ttl: 120, prefix: 'tenant:users:' }, // 2 min
  case_list: { ttl: 60, prefix: 'cases:list:' }, // 1 min
  dashboard: { ttl: 180, prefix: 'dashboard:' }, // 3 min
} as const;

// Implementación de caché en memoria (fallback si no hay Redis)
// En producción, esto se reemplaza por Redis real
class MemoryCache implements CacheClient {
  private cache = new Map<string, { value: any; expiry: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const ttl = options.ttl || 300;
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Exportar cliente de caché (usar MemoryCache por defecto)
// En producción con Redis, usar el cliente de Redis
export const cache: CacheClient = new MemoryCache();

// Helper functions
export async function getTenantCachedStats<T>(
  tenantId: string,
): Promise<T | null> {
  const key = `${CACHE_STRATEGIES.tenant_stats.prefix}${tenantId}`;
  return cache.get<T>(key);
}

export async function setTenantCachedStats<T>(
  tenantId: string,
  data: T,
): Promise<void> {
  const key = `${CACHE_STRATEGIES.tenant_stats.prefix}${tenantId}`;
  await cache.set(key, data, { ttl: CACHE_STRATEGIES.tenant_stats.ttl });
}

export async function invalidateTenantCache(tenantId: string): Promise<void> {
  await cache.invalidatePattern(`tenant:${tenantId}:*`);
}

export async function getCachedCatalogs<T>(
  tenantId: string,
  catalogType: string,
): Promise<T | null> {
  const key = `${CACHE_STRATEGIES.catalogs.prefix}${tenantId}:${catalogType}`;
  return cache.get<T>(key);
}

export async function setCachedCatalogs<T>(
  tenantId: string,
  catalogType: string,
  data: T,
): Promise<void> {
  const key = `${CACHE_STRATEGIES.catalogs.prefix}${tenantId}:${catalogType}`;
  await cache.set(key, data, { ttl: CACHE_STRATEGIES.catalogs.ttl });
}
