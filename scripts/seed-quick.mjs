#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv();

const hasSupabaseConfig =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY);

if (!hasSupabaseConfig) {
  console.log('[seed:quick] Omitido: faltan variables de Supabase en .env.local.');
  process.exit(0);
}

// Placeholder seguro para no romper pipelines locales.
// El seed real debe ejecutarse desde migraciones SQL/Supabase CLI.
console.log('[seed:quick] Configuración detectada. No se aplican seeds automáticos en este script.');
process.exit(0);
