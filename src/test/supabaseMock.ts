import { vi } from 'vitest';

/**
 * Mock completo del supabaseClient con todas las exportaciones y métodos chainables
 * Usar en tests para evitar "No export defined" errors
 */

// Crear chainable query mock que soporta todos los métodos comunes
export const createChainableMock = (data: any = [], error: any = null) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn((resolve) => resolve({ data, error })),
  };

  // Also make it a thenable (promise-like) for direct await
  chain.then = vi.fn((resolve) => resolve({ data, error, count: data?.length || 0 }));
  
  return chain;
};

// Mock storage bucket
export const createStorageMock = () => ({
  upload: vi.fn().mockResolvedValue({ error: null }),
  download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
  remove: vi.fn().mockResolvedValue({ error: null }),
  createSignedUrl: vi.fn().mockResolvedValue({ 
    data: { signedUrl: 'https://signed.example/file' }, 
    error: null 
  }),
  getPublicUrl: vi.fn().mockReturnValue({ 
    data: { publicUrl: 'https://public.example/file' } 
  }),
});

// Mock completo del cliente supabase
export const createSupabaseMock = () => ({
  from: vi.fn(() => createChainableMock()),
  rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  storage: {
    from: vi.fn(() => createStorageMock()),
  },
  auth: {
    signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })),
  },
});

// Mock de las funciones exportadas por supabaseClient
export const supabaseClientMockFunctions = {
  setSessionToken: vi.fn(),
  getSessionToken: vi.fn(() => null),
  clearSessionToken: vi.fn(),
  checkSupabaseConnection: vi.fn().mockResolvedValue(true),
  subscribeAuthChanges: vi.fn(),
  unsubscribeAuthChanges: vi.fn(),
  getSupabaseClient: vi.fn(),
};

/**
 * Mock completo para usar con vi.mock()
 * 
 * Ejemplo de uso en archivos de test:
 * ```ts
 * vi.mock('./supabaseClient', () => ({
 *   ...supabaseClientFullMock,
 *   supabase: createSupabaseMock(), // customizar si es necesario
 * }));
 * ```
 */
export const supabaseClientFullMock = {
  supabase: createSupabaseMock(),
  ...supabaseClientMockFunctions,
};

/**
 * Helper para crear un mock customizado con data específica
 */
export const mockSupabaseQuery = (data: any, error: any = null) => {
  const supabaseMock = createSupabaseMock();
  supabaseMock.from = vi.fn(() => createChainableMock(data, error));
  return supabaseMock;
};
