-- =====================================================
-- 37_multi_tenant_hardening.sql
-- Endurece aislamiento multi-tenant y evita fugas entre colegios
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1) Helpers de tenant/rol con search_path seguro
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tp.tenant_id
  FROM public.tenant_profiles tp
  WHERE tp.id = auth.uid()
    AND tp.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_profiles tp
    WHERE tp.id = auth.uid()
      AND tp.role = 'platform_admin'
      AND tp.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_profiles tp
    WHERE tp.id = auth.uid()
      AND tp.role IN ('tenant_admin', 'platform_admin')
      AND tp.is_active = true
  );
$$;

-- -----------------------------------------------------
-- 2) tenants: eliminar lectura global de colegios
-- -----------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active tenants" ON public.tenants;
DROP POLICY IF EXISTS tenants_select_active ON public.tenants;
DROP POLICY IF EXISTS tenants_select_platform ON public.tenants;
DROP POLICY IF EXISTS tenants_insert_platform ON public.tenants;
DROP POLICY IF EXISTS tenants_update_platform ON public.tenants;
DROP POLICY IF EXISTS tenants_delete_platform ON public.tenants;

CREATE POLICY tenants_select_own_or_platform
ON public.tenants
FOR SELECT
USING (
  public.is_platform_admin() = true
  OR id = public.current_tenant_id()
);

CREATE POLICY tenants_insert_platform
ON public.tenants
FOR INSERT
WITH CHECK (public.is_platform_admin() = true);

CREATE POLICY tenants_update_platform
ON public.tenants
FOR UPDATE
USING (public.is_platform_admin() = true)
WITH CHECK (public.is_platform_admin() = true);

CREATE POLICY tenants_delete_platform
ON public.tenants
FOR DELETE
USING (public.is_platform_admin() = true);

-- -----------------------------------------------------
-- 3) tenant_profiles: evitar escalación de privilegios
-- -----------------------------------------------------
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_profiles_select_own ON public.tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_select_platform ON public.tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_select_tenant ON public.tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_update_own ON public.tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_insert_platform ON public.tenant_profiles;

CREATE POLICY tenant_profiles_select_own
ON public.tenant_profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY tenant_profiles_select_tenant_admin
ON public.tenant_profiles
FOR SELECT
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_admin() = true
);

CREATE POLICY tenant_profiles_select_platform
ON public.tenant_profiles
FOR SELECT
USING (public.is_platform_admin() = true);

-- Usuario normal solo puede actualizar su perfil sin cambiar tenant ni rol
CREATE POLICY tenant_profiles_update_own_safe
ON public.tenant_profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND tenant_id = public.current_tenant_id()
  AND role = (
    SELECT tp.role
    FROM public.tenant_profiles tp
    WHERE tp.id = auth.uid()
    LIMIT 1
  )
);

-- Admin de tenant (o platform_admin) puede gestionar usuarios de su tenant
CREATE POLICY tenant_profiles_update_tenant_admin
ON public.tenant_profiles
FOR UPDATE
USING (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_admin() = true
)
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.is_tenant_admin() = true
);

CREATE POLICY tenant_profiles_insert_platform
ON public.tenant_profiles
FOR INSERT
WITH CHECK (public.is_platform_admin() = true);

-- -----------------------------------------------------
-- 4) RLS forzada en tablas sensibles tenant-scoped
-- -----------------------------------------------------
ALTER TABLE public.students FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cases FORCE ROW LEVEL SECURITY;
ALTER TABLE public.case_followups FORCE ROW LEVEL SECURITY;
ALTER TABLE public.followup_evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'case_messages'
  ) THEN
    ALTER TABLE public.case_messages FORCE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'case_message_attachments'
  ) THEN
    ALTER TABLE public.case_message_attachments FORCE ROW LEVEL SECURITY;
  END IF;
END $$;

-- -----------------------------------------------------
-- 5) Funciones legacy peligrosas: no exponer a anon
-- -----------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'create_tenant_with_admin'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.create_tenant_with_admin(text, text, text, text, text)
    FROM anon, authenticated;
  END IF;
END $$;

COMMIT;
