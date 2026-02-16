-- Permite a un platform_admin cambiar su tenant activo sin SQL manual

CREATE OR REPLACE FUNCTION public.platform_switch_tenant(
  p_tenant_id uuid
)
RETURNS public.tenant_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.tenant_profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = p_tenant_id
      AND t.is_active = true
  ) THEN
    RAISE EXCEPTION 'Tenant no encontrado o inactivo';
  END IF;

  UPDATE public.tenant_profiles
  SET tenant_id = p_tenant_id,
      updated_at = now()
  WHERE id = auth.uid()
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado para el usuario actual';
  END IF;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.platform_switch_tenant(uuid)
TO authenticated, service_role;
