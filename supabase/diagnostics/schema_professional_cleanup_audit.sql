-- =====================================================
-- schema_professional_cleanup_audit.sql
-- Auditoria read-only para detectar objetos legacy/sobrantes
-- =====================================================

-- 1) Tablas candidatas a deprecacion (si no se usan en tu operacion)
WITH candidates(name) AS (
  VALUES
    ('process_stages'),
    ('evidence'),
    ('tenant_catalogs'),
    ('platform_versions'),
    ('tenant_versions'),
    ('catalog_staging_batches'),
    ('stg_conduct_types'),
    ('stg_conduct_catalog'),
    ('stg_stage_sla'),
    ('stg_action_types'),
    ('tenant_stats')
)
SELECT
  c.name AS object_name,
  CASE WHEN to_regclass('public.' || c.name) IS NULL THEN 'NOT_PRESENT' ELSE 'PRESENT' END AS status
FROM candidates c
ORDER BY c.name;

-- 2) Columnas legacy en cases
WITH legacy_cols(col) AS (
  VALUES
    ('actions_taken'),
    ('guardian_notified'),
    ('student_name')
)
SELECT
  col AS column_name,
  CASE WHEN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cases'
      AND column_name = col
  ) THEN 'PRESENT' ELSE 'NOT_PRESENT' END AS status
FROM legacy_cols
ORDER BY col;

-- 3) Coherencia catalogos vs funciones de onboarding/staging
SELECT
  'conduct_types_has_tenant_id' AS check_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conduct_types' AND column_name='tenant_id'
  ) AS ok
UNION ALL
SELECT
  'conduct_types_has_type_name',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conduct_types' AND column_name='type_name'
  )
UNION ALL
SELECT
  'stage_sla_has_tenant_id',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stage_sla' AND column_name='tenant_id'
  );

-- 4) Funciones candidatas legacy/operacionales
WITH fn(name) AS (
  VALUES
    ('create_tenant_with_admin'),
    ('refresh_tenant_stats'),
    ('validate_college_catalogs'),
    ('apply_college_catalogs'),
    ('onboard_college')
)
SELECT
  fn.name AS function_name,
  CASE WHEN EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = fn.name
  ) THEN 'PRESENT' ELSE 'NOT_PRESENT' END AS status
FROM fn
ORDER BY fn.name;

-- 5) RLS activo en tablas sensibles
WITH t(name) AS (
  VALUES
    ('stage_sla'),
    ('conduct_types'),
    ('conduct_catalog'),
    ('action_types'),
    ('cases'),
    ('students'),
    ('case_followups')
)
SELECT
  t.name AS table_name,
  CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM t
JOIN pg_class c ON c.relname = t.name
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY t.name;

-- 6) Indices potencialmente redundantes (aprox por definicion textual)
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname ILIKE 'idx_cases_status%'
    OR indexname ILIKE 'idx_cases_tenant_status%'
    OR indexname ILIKE 'idx_followups_case_id%'
    OR indexname ILIKE 'idx_followups_tenant_case%'
  )
ORDER BY tablename, indexname;
