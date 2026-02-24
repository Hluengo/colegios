-- =====================================================
-- 35_parameters_audit_crud.sql
-- Parámetros + Auditoría: hardening, trigger y RPCs de gestión
-- =====================================================

-- -----------------------------------------------------
-- 1) tenant_settings: integridad y auditoría
-- -----------------------------------------------------
ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_settings_tenant_key
  ON public.tenant_settings (tenant_id, setting_key);

-- Trigger updated_at (usa helper existente si está disponible)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_tenant_settings_updated_at ON public.tenant_settings;
    CREATE TRIGGER trigger_tenant_settings_updated_at
      BEFORE UPDATE ON public.tenant_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger de auditoría para tenant_settings (si existe función audit.if_modified_func)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'audit'
      AND p.proname = 'if_modified_func'
  ) THEN
    DROP TRIGGER IF EXISTS audit_tenant_settings ON public.tenant_settings;
    CREATE TRIGGER audit_tenant_settings
      AFTER INSERT OR UPDATE OR DELETE ON public.tenant_settings
      FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func();
  END IF;
END $$;

-- -----------------------------------------------------
-- 2) audit_logs: columna de nota y políticas
-- -----------------------------------------------------
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS admin_note text;

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action_date
  ON public.audit_logs (tenant_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_table_date
  ON public.audit_logs (tenant_id, table_name, created_at DESC);

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- tenant_settings policies (idempotentes)
DROP POLICY IF EXISTS settings_select ON public.tenant_settings;
DROP POLICY IF EXISTS settings_manage ON public.tenant_settings;
DROP POLICY IF EXISTS tenant_settings_select ON public.tenant_settings;
DROP POLICY IF EXISTS tenant_settings_manage ON public.tenant_settings;

CREATE POLICY tenant_settings_select ON public.tenant_settings
  FOR SELECT
  USING (tenant_id = public.current_tenant_id() OR public.is_platform_admin() = true);

CREATE POLICY tenant_settings_manage ON public.tenant_settings
  FOR ALL
  USING (
    public.is_platform_admin() = true
    OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = true)
  )
  WITH CHECK (
    public.is_platform_admin() = true
    OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = true)
  );

-- audit_logs policies (idempotentes)
DROP POLICY IF EXISTS audit_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_insert ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;

CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT
  USING (tenant_id = public.current_tenant_id() OR public.is_platform_admin() = true);

-- Permite inserciones de auditoría por trigger y por RPC administrativa controlada
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    public.is_platform_admin() = true
    OR tenant_id = public.current_tenant_id()
  );

-- -----------------------------------------------------
-- 3) RPCs de gestión de auditoría desde frontend
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_audit_log(
  p_tenant_id uuid,
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.audit_logs;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.is_platform_admin()
    OR (public.is_tenant_admin() AND p_tenant_id = public.current_tenant_id())
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    admin_note
  )
  VALUES (
    p_tenant_id,
    auth.uid(),
    upper(coalesce(nullif(trim(p_action), ''), 'MANUAL')),
    coalesce(nullif(trim(p_table_name), ''), 'manual'),
    p_record_id,
    NULL,
    coalesce(p_new_values, '{}'::jsonb),
    p_note
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_audit_log_note(
  p_audit_id uuid,
  p_note text
)
RETURNS public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_row public.audit_logs;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT tenant_id INTO v_tenant_id
  FROM public.audit_logs
  WHERE id = p_audit_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Audit log no encontrado';
  END IF;

  IF NOT (
    public.is_platform_admin()
    OR (public.is_tenant_admin() AND v_tenant_id = public.current_tenant_id())
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.audit_logs
  SET admin_note = p_note
  WHERE id = p_audit_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_audit_log(
  p_audit_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT tenant_id INTO v_tenant_id
  FROM public.audit_logs
  WHERE id = p_audit_id;

  IF v_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  IF NOT (
    public.is_platform_admin()
    OR (public.is_tenant_admin() AND v_tenant_id = public.current_tenant_id())
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  DELETE FROM public.audit_logs
  WHERE id = p_audit_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_purge_audit_logs(
  p_tenant_id uuid,
  p_before timestamptz
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count bigint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.is_platform_admin()
    OR (public.is_tenant_admin() AND p_tenant_id = public.current_tenant_id())
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  DELETE FROM public.audit_logs
  WHERE tenant_id = p_tenant_id
    AND created_at < p_before;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_audit_log(uuid, text, text, uuid, text, jsonb)
TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_audit_log_note(uuid, text)
TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_audit_log(uuid)
TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_purge_audit_logs(uuid, timestamptz)
TO authenticated, service_role;
