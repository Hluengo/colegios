#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv();

console.log('[seed:dev] Script base disponible. Usa migraciones en /supabase para poblar datos.');
process.exit(0);
