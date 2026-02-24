import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ejecutar la función directamente en tests para evitar retries reales
vi.mock('../withRetry', () => ({ withRetry: (fn: any) => fn() }));

// Silenciar logger en estos tests
vi.mock('../utils/logger', () => ({ warn: () => undefined, error: () => undefined, debug: () => undefined }));

describe('db more branches', () => {
  beforeEach(() => vi.resetModules());

  // NOTE: getCaseFollowups involves several Supabase helpers and
  // integration points already covered elsewhere. We keep the
  // focused startSeguimiento branch test below.

  it('startSeguimiento lanza si el caso no existe (Caso no encontrado)', async () => {
    vi.mock('./supabaseClient', () => ({
      supabase: {
        from: (table: string) => ({
          select: () => ({ single: () => ({ then: (resolve: any) => resolve({ data: null, error: null }) }) }),
        }),
        rpc: () => ({ then: (resolve: any) => resolve({ error: null }) }),
      },
    }));

    const { startSeguimiento } = await import('../db');
    await expect(startSeguimiento('missing')).rejects.toBeDefined();
  });
});
