-- =====================================================
-- 26_admin_tenant_profile_rpcs.sql
-- RPCs administrativas para gestión de usuarios por tenant
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_update_tenant_profile(
  p_profile_id uuid,
  p_full_name text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_department text DEFAULT NULL
)
RETURNS public.tenant_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_is_platform boolean;
  v_actor_tenant uuid;
  v_target public.tenant_profiles;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_actor_is_platform := public.is_platform_admin();
  v_actor_tenant := public.current_tenant_id();

  SELECT *
  INTO v_target
  FROM public.tenant_profiles
  WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado';
  END IF;

  IF NOT v_actor_is_platform THEN
    IF NOT public.is_tenant_admin() THEN
      RAISE EXCEPTION 'No autorizado';
    END IF;
    IF v_target.tenant_id <> v_actor_tenant THEN
      RAISE EXCEPTION 'No autorizado para otro tenant';
    END IF;
    IF v_target.role = 'platform_admin' THEN
      RAISE EXCEPTION 'No autorizado para modificar platform_admin';
    END IF;
  END IF;

  v_role := COALESCE(p_role, v_target.role);
  IF v_role NOT IN ('platform_admin', 'tenant_admin', 'user', 'readonly') THEN
    RAISE EXCEPTION 'Rol inválido: %', v_role;
  END IF;

  UPDATE public.tenant_profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    role = v_role,
    is_active = COALESCE(p_is_active, is_active),
    phone = COALESCE(p_phone, phone),
    department = COALESCE(p_department, department),
    updated_at = now()
  WHERE id = p_profile_id
  RETURNING * INTO v_target;

  RETURN v_target;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_tenant_profile(uuid, text, text, boolean, text, text)
TO authenticated, service_role;

SELECT 'OK: admin tenant profile RPC ready' AS status;
