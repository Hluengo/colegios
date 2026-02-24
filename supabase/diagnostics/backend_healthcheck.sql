-- =====================================================
-- Backend Healthcheck (read-only)
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1) Tablas requeridas
WITH required_tables(table_name) AS (
  VALUES
    ('tenants'),
    ('tenant_profiles'),
    ('students'),
    ('cases'),
    ('case_followups'),
    ('followup_evidence'),
    ('stage_sla'),
    ('conduct_types'),
    ('conduct_catalog'),
    ('action_types'),
    ('case_messages'),
    ('tenant_catalogs'),
    ('tenant_settings'),
    ('audit_logs')
)
SELECT
  rt.table_name,
  CASE WHEN t.table_name IS NULL THEN 'MISSING' ELSE 'OK' END AS table_status
FROM required_tables rt
LEFT JOIN information_schema.tables t
  ON t.table_schema = 'public'
 AND t.table_name = rt.table_name
ORDER BY rt.table_name;

-- 2) Columnas críticas
WITH required_columns(table_name, column_name) AS (
  VALUES
    ('tenant_profiles', 'tenant_id'),
    ('tenant_profiles', 'role'),
    ('cases', 'tenant_id'),
    ('cases', 'status'),
    ('case_followups', 'tenant_id'),
    ('case_followups', 'process_stage'),
    ('case_followups', 'due_date'),
    ('case_followups', 'due_at'),
    ('stage_sla', 'stage_key'),
    ('stage_sla', 'days_to_due'),
    ('conduct_types', 'sort_order'),
    ('conduct_catalog', 'sort_order'),
    ('action_types', 'sort_order'),
    ('case_messages', 'body'),
    ('case_messages', 'tenant_id')
)
SELECT
  rc.table_name,
  rc.column_name,
  CASE WHEN c.column_name IS NULL THEN 'MISSING' ELSE 'OK' END AS column_status
FROM required_columns rc
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = rc.table_name
 AND c.column_name = rc.column_name
ORDER BY rc.table_name, rc.column_name;

-- 3) Funciones helper críticas
WITH required_functions(schema_name, function_name) AS (
  VALUES
    ('public', 'current_tenant_id'),
    ('public', 'is_platform_admin'),
    ('public', 'is_tenant_admin'),
    ('public', 'business_days_between')
)
SELECT
  rf.schema_name,
  rf.function_name,
  CASE WHEN EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = rf.schema_name
      AND p.proname = rf.function_name
  ) THEN 'OK' ELSE 'MISSING' END AS function_status
FROM required_functions rf
ORDER BY rf.schema_name, rf.function_name;

-- 4) RLS habilitado
WITH required_rls(table_name) AS (
  VALUES
    ('tenants'),
    ('tenant_profiles'),
    ('students'),
    ('cases'),
    ('case_followups'),
    ('followup_evidence'),
    ('stage_sla'),
    ('conduct_types'),
    ('conduct_catalog'),
    ('action_types'),
    ('case_messages'),
    ('tenant_catalogs'),
    ('tenant_settings'),
    ('audit_logs')
)
SELECT
  rr.table_name,
  CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM required_rls rr
JOIN pg_class c ON c.relname = rr.table_name
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
ORDER BY rr.table_name;

-- 5) Vista crítica
SELECT
  'v_control_unificado' AS object_name,
  CASE WHEN EXISTS (
    SELECT 1
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name = 'v_control_unificado'
  ) THEN 'OK' ELSE 'MISSING' END AS view_status;

-- 6) Smoke query de vista (no modifica datos)
DO $$
BEGIN
  BEGIN
    EXECUTE 'SELECT 1 FROM public.v_control_unificado LIMIT 1';
    RAISE NOTICE 'v_control_unificado smoke: OK';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'v_control_unificado smoke: ERROR -> %', SQLERRM;
  END;
END $$;

-- 7) Conteo rápido de datos base
DROP TABLE IF EXISTS _health_counts;
CREATE TEMP TABLE _health_counts (
  table_name TEXT,
  total BIGINT,
  table_status TEXT
) ON COMMIT DROP;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tenants',
    'tenant_profiles',
    'students',
    'cases',
    'case_followups',
    'conduct_types',
    'conduct_catalog',
    'action_types'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      INSERT INTO _health_counts (table_name, total, table_status)
      VALUES (t, 0, 'MISSING');
    ELSE
      EXECUTE format(
        'INSERT INTO _health_counts (table_name, total, table_status) SELECT %L, COUNT(*), %L FROM public.%I',
        t, 'OK', t
      );
    END IF;
  END LOOP;
END $$;

SELECT table_name, total, table_status
FROM _health_counts
ORDER BY table_name;
