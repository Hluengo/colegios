-- =====================================================
-- post_deploy_checks.sql
-- Verificacion minima post-despliegue de backend
-- =====================================================

-- 1) Objetos criticos (tablas y vista)
SELECT
  'public.tenants' AS object_name,
  to_regclass('public.tenants') IS NOT NULL AS exists
UNION ALL
SELECT 'public.tenant_profiles', to_regclass('public.tenant_profiles') IS NOT NULL
UNION ALL
SELECT 'public.conduct_types', to_regclass('public.conduct_types') IS NOT NULL
UNION ALL
SELECT 'public.conduct_catalog', to_regclass('public.conduct_catalog') IS NOT NULL
UNION ALL
SELECT 'public.action_types', to_regclass('public.action_types') IS NOT NULL
UNION ALL
SELECT 'public.stage_sla', to_regclass('public.stage_sla') IS NOT NULL
UNION ALL
SELECT 'public.v_control_unificado', to_regclass('public.v_control_unificado') IS NOT NULL;

-- 2) RPCs criticas
SELECT
  proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN (
    'apply_college_catalogs',
    'onboard_college',
    'platform_switch_tenant',
    'admin_update_tenant_profile'
  )
ORDER BY proname;

-- 3) Buckets usados por la app (requiere schema storage disponible)
SELECT id, name, public
FROM storage.buckets
WHERE id IN ('branding', 'evidencias')
ORDER BY id;

-- 4) Conteos basicos (sanity check)
SELECT 'tenants' AS table_name, COUNT(*)::bigint AS total FROM public.tenants
UNION ALL
SELECT 'tenant_profiles', COUNT(*)::bigint FROM public.tenant_profiles
UNION ALL
SELECT 'students', COUNT(*)::bigint FROM public.students
UNION ALL
SELECT 'cases', COUNT(*)::bigint FROM public.cases
UNION ALL
SELECT 'case_followups', COUNT(*)::bigint FROM public.case_followups;
