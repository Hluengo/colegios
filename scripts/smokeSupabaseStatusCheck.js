#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  console.warn('[smoke:status] Omitido: falta VITE_SUPABASE_URL.');
  process.exitCode = 0;
  process.exit();
}

try {
  const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
    signal: AbortSignal.timeout(8000),
  });

  if (res.status === 401 || res.status === 403) {
    console.warn(
      `[smoke:status] OK conectividad auth (acceso protegido, HTTP ${res.status}).`,
    );
    process.exitCode = 0;
  } else if (!res.ok) {
    console.error(`[smoke:status] FAIL auth healthcheck: HTTP ${res.status}`);
    process.exitCode = 1;
  } else {
    console.warn('[smoke:status] OK auth healthcheck.');
    process.exitCode = 0;
  }
} catch (error) {
  console.error('[smoke:status] FAIL', error?.message || error);
  process.exitCode = 1;
}
