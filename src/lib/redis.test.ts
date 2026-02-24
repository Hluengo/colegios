import { describe, it, expect } from 'vitest';
import {
  CACHE_STRATEGIES,
  cache,
  getTenantCachedStats,
  setTenantCachedStats,
  getCachedCatalogs,
  setCachedCatalogs,
} from './redis';

describe('redis cache (memory fallback)', () => {
  it('exports CACHE_STRATEGIES and cache helper functions', async () => {
    expect(CACHE_STRATEGIES).toBeDefined();
    await setTenantCachedStats('t1', { a: 1 });
    const s = await getTenantCachedStats('t1');
    expect(s).toEqual({ a: 1 });

    await setCachedCatalogs('t1', 'cats', ['x']);
    const c = await getCachedCatalogs('t1', 'cats');
    expect(c).toEqual(['x']);
  });
});
