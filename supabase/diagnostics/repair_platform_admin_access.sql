-- =====================================================
-- repair_platform_admin_access.sql
-- Recupera acceso para un platform_admin bloqueado
-- =====================================================
-- USO:
-- 1) Reemplaza el email en la CTE "params"
-- 2) Ejecuta todo el script en Supabase SQL Editor

BEGIN;

WITH params AS (
  SELECT
    lower(trim('TU_EMAIL_ADMIN@DOMINIO.CL'))::text AS admin_email,
    'recovery-admin'::text AS fallback_slug,
    'Colegio Recuperacion Admin'::text AS fallback_name
),
existing_active_tenant AS (
  SELECT t.id
  FROM public.tenants t
  WHERE t.is_active = true
  ORDER BY t.created_at ASC
  LIMIT 1
),
created_fallback_tenant AS (
  INSERT INTO public.tenants (slug, name, email, is_active, subscription_status, subscription_plan)
  SELECT p.fallback_slug, p.fallback_name, p.admin_email, true, 'active', 'basic'
  FROM params p
  WHERE NOT EXISTS (SELECT 1 FROM existing_active_tenant)
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    is_active = true
  RETURNING id
),
target_tenant AS (
  SELECT id FROM existing_active_tenant
  UNION ALL
  SELECT id FROM created_fallback_tenant
  LIMIT 1
),
auth_user AS (
  SELECT u.id, lower(u.email)::text AS email
  FROM auth.users u
  JOIN params p ON lower(u.email) = p.admin_email
  ORDER BY u.created_at ASC
  LIMIT 1
),
upsert_profile AS (
  INSERT INTO public.tenant_profiles (
    id,
    tenant_id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
  )
  SELECT
    au.id,
    tt.id,
    au.email,
    'Platform Admin',
    'platform_admin',
    true,
    now(),
    now()
  FROM auth_user au
  CROSS JOIN target_tenant tt
  ON CONFLICT (id) DO UPDATE
  SET
    tenant_id = EXCLUDED.tenant_id,
    email = EXCLUDED.email,
    role = 'platform_admin',
    is_active = true,
    updated_at = now()
  RETURNING id, tenant_id, email, role, is_active
)
SELECT
  'repair_result' AS section,
  p.admin_email,
  au.id AS auth_user_id,
  tt.id AS assigned_tenant_id,
  up.role AS final_role,
  up.is_active AS profile_active
FROM params p
LEFT JOIN auth_user au ON true
LEFT JOIN target_tenant tt ON true
LEFT JOIN upsert_profile up ON true;

-- Si auth_user no existe, informar explícitamente
SELECT
  'warning' AS section,
  p.admin_email,
  'No existe usuario en auth.users con ese email. Debes iniciar sesión/registrar primero ese correo.' AS detail
FROM (
  SELECT lower(trim('TU_EMAIL_ADMIN@DOMINIO.CL'))::text AS admin_email
) p
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.users u
  WHERE lower(u.email) = p.admin_email
);

COMMIT;

-- Verificación rápida
SELECT id, slug, name, is_active
FROM public.tenants
WHERE is_active = true
ORDER BY created_at ASC
LIMIT 5;

SELECT id, email, tenant_id, role, is_active
FROM public.tenant_profiles
WHERE lower(email) = lower('TU_EMAIL_ADMIN@DOMINIO.CL');
