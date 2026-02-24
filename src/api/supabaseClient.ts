import {
  createClient,
  Session,
  AuthChangeEvent,
  SupabaseClient,
} from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import type { Database } from '../types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  logger.error(
    'Supabase: faltan variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY',
  );
  throw new Error(
    'Supabase config: define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY en .env.local',
  );
}

// Singleton para el cliente Supabase
let supabaseInstance: SupabaseClient<Database> | null = null;
export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(30000),
          }).catch((error) => {
            logger.error('Supabase fetch error:', {
              url,
              error: error.message,
              type: error.name,
            });
            throw error;
          });
        },
      },
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

// Manejo seguro de sesión y tokens
export function setSessionToken(token: string) {
  // Cifrar token antes de guardar
  const encrypted = btoa(token);
  localStorage.setItem('sb-auth-token', encrypted);
}

export function getSessionToken(): string | null {
  const encrypted = localStorage.getItem('sb-auth-token');
  if (!encrypted) return null;
  try {
    return atob(encrypted);
  } catch {
    return null;
  }
}

export function clearSessionToken() {
  localStorage.removeItem('sb-auth-token');
}

// Suscripción a cambios de sesión
let authListener: ReturnType<typeof supabase.auth.onAuthStateChange> | null =
  null;

function unsubscribeAuthListener(
  listener: ReturnType<typeof supabase.auth.onAuthStateChange> | null,
) {
  if (!listener) return;
  // Supabase v2: { data: { subscription } }
  // Fallback defensivo por si cambia el shape en entornos mixtos.
  const sub = (listener as any)?.data?.subscription;
  if (sub && typeof sub.unsubscribe === 'function') {
    sub.unsubscribe();
    return;
  }
  const legacy = (listener as any)?.data;
  if (legacy && typeof legacy.unsubscribe === 'function') {
    legacy.unsubscribe();
  }
}

export function subscribeAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  unsubscribeAuthListener(authListener);
  authListener = supabase.auth.onAuthStateChange(callback);
}

export function unsubscribeAuthChanges() {
  unsubscribeAuthListener(authListener);
  authListener = null;
}

// Verificar que el servidor de Supabase esté disponible
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    logger.error('Supabase connection check failed:', error);
    return false;
  }
}
