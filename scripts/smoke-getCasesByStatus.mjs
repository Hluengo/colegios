#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.log('[smoke] Omitido: faltan credenciales de Supabase.');
  process.exit(0);
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8000);

try {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/cases?select=id,status&limit=1`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: controller.signal,
    },
  );

  if (res.status === 401 || res.status === 403) {
    console.log(`[smoke] OK conectividad Supabase (RLS activo, HTTP ${res.status}).`);
    process.exit(0);
  }

  if (!res.ok) {
    console.error(`[smoke] FAIL consulta de casos: HTTP ${res.status}`);
    process.exit(1);
  }

  const rows = await res.json();
  if (!Array.isArray(rows)) {
    console.error('[smoke] FAIL respuesta inválida de casos.');
    process.exit(1);
  }

  console.log(`[smoke] OK consulta de casos (${rows.length} fila(s) sample).`);
} catch (error) {
  console.error('[smoke] FAIL', error?.message || error);
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
