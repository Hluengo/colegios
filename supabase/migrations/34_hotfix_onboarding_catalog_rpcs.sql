-- =====================================================
-- 34_hotfix_onboarding_catalog_rpcs.sql
-- Hotfix: onboarding y aplicacion de catalogos sin tenant_versions
-- ni tablas staging legacy
-- =====================================================

-- Compatibilidad: valida existencia de tenant y devuelve sin errores
CREATE OR REPLACE FUNCTION public.validate_college_catalogs(
  p_tenant_id uuid,
  p_batch_id uuid DEFAULT NULL
)
RETURNS TABLE(section text, row_ref text, error_code text, error_detail text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = p_tenant_id
      AND t.is_active = true
  ) THEN
    RETURN QUERY
    SELECT 'tenant'::text, '-'::text, 'NOT_FOUND'::text, 'Tenant no encontrado o inactivo'::text;
    RETURN;
  END IF;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_college_catalogs(uuid, uuid)
TO authenticated, service_role;

-- Publica catalogos minimos compatibles con esquema actual
CREATE OR REPLACE FUNCTION public.apply_college_catalogs(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = p_tenant_id
      AND t.is_active = true
  ) THEN
    RAISE EXCEPTION 'Tenant no encontrado o inactivo: %', p_tenant_id;
  END IF;

  INSERT INTO public.conduct_types (key, label, color, sort_order, active)
  VALUES
    ('agresion_fisica', 'Agresión Física', '#ef4444', 1, true),
    ('agresion_verbal', 'Agresión Verbal', '#f97316', 2, true),
    ('bullying', 'Bullying', '#dc2626', 3, true),
    ('ciberbullying', 'Ciberbullying', '#b91c1c', 4, true),
    ('robo', 'Robo', '#d97706', 5, true),
    ('vandalismo', 'Vandalismo', '#ea580c', 6, true),
    ('consumo_sustancias', 'Consumo de Sustancias', '#7c2d12', 7, true),
    ('falta_respeto', 'Falta de Respeto', '#0ea5e9', 8, true),
    ('otro', 'Otro', '#64748b', 99, true)
  ON CONFLICT (key) DO UPDATE
  SET label = EXCLUDED.label,
      color = EXCLUDED.color,
      sort_order = EXCLUDED.sort_order,
      active = EXCLUDED.active;

  INSERT INTO public.conduct_catalog (conduct_type, conduct_category, sort_order, active)
  VALUES
    ('agresion_fisica', 'Golpear', 1, true),
    ('agresion_fisica', 'Empujar', 2, true),
    ('agresion_fisica', 'Patear', 3, true),
    ('agresion_verbal', 'Insultar', 1, true),
    ('agresion_verbal', 'Humillar', 2, true),
    ('agresion_verbal', 'Amenazar', 3, true),
    ('bullying', 'Acoso continuo', 1, true),
    ('bullying', 'Exclusión social', 2, true),
    ('robo', 'Hurto', 1, true),
    ('robo', 'Extorsión', 2, true),
    ('falta_respeto', 'Interrupción', 1, true),
    ('falta_respeto', 'Desobediencia', 2, true),
    ('otro', 'Otro', 99, true)
  ON CONFLICT (conduct_type, conduct_category) DO UPDATE
  SET sort_order = EXCLUDED.sort_order,
      active = EXCLUDED.active;

  INSERT INTO public.stage_sla (stage_key, days_to_due)
  VALUES
    ('recepcion', 1),
    ('analisis', 2),
    ('investigacion', 3),
    ('resolucion', 2),
    ('seguimiento', 7)
  ON CONFLICT (stage_key) DO UPDATE
  SET days_to_due = EXCLUDED.days_to_due;

  INSERT INTO public.action_types (tenant_id, key, label, description, sort_order, is_active)
  VALUES
    (p_tenant_id, 'seguimiento', 'Seguimiento', 'Seguimiento general', 1, true),
    (p_tenant_id, 'entrevista', 'Entrevista', 'Entrevista con involucrados', 2, true),
    (p_tenant_id, 'citacion', 'Citación', 'Citación formal', 3, true),
    (p_tenant_id, 'derivacion', 'Derivación', 'Derivación a especialista', 4, true),
    (p_tenant_id, 'medida_disciplinaria', 'Medida Disciplinaria', 'Aplicación de medida', 5, true),
    (p_tenant_id, 'cierre', 'Cierre', 'Cierre del caso', 6, true)
  ON CONFLICT (tenant_id, key) DO UPDATE
  SET label = EXCLUDED.label,
      description = EXCLUDED.description,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active;

  RETURN jsonb_build_object(
    'ok', true,
    'tenant_id', p_tenant_id,
    'applied_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_college_catalogs(uuid)
TO authenticated, service_role;

-- Onboarding sin dependencia a tenant_versions/platform_versions
CREATE OR REPLACE FUNCTION public.onboard_college(
  p_slug text,
  p_name text,
  p_email text,
  p_admin_user_id uuid DEFAULT NULL,
  p_subscription_plan text DEFAULT 'basic',
  p_trial_days integer DEFAULT 14
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  INSERT INTO public.tenants (
    slug, name, email, subscription_status, subscription_plan, trial_end_date, is_active
  )
  VALUES (
    lower(p_slug),
    p_name,
    p_email,
    'trial',
    COALESCE(NULLIF(p_subscription_plan, ''), 'basic'),
    now() + (COALESCE(p_trial_days, 14) || ' days')::interval,
    true
  )
  ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      email = EXCLUDED.email,
      subscription_plan = EXCLUDED.subscription_plan
  RETURNING id INTO v_tenant_id;

  IF p_admin_user_id IS NOT NULL THEN
    UPDATE public.tenant_profiles
    SET tenant_id = v_tenant_id,
        role = 'tenant_admin',
        is_active = true,
        updated_at = now()
    WHERE id = p_admin_user_id;
  END IF;

  PERFORM public.apply_college_catalogs(v_tenant_id);

  RETURN jsonb_build_object(
    'ok', true,
    'tenant_id', v_tenant_id,
    'slug', lower(p_slug)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.onboard_college(text, text, text, uuid, text, integer)
TO authenticated, service_role;
