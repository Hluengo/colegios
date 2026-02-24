-- =====================================================
-- 33_cleanup_schema_profesional.sql
-- Limpieza profesional del esquema + compatibilidad RPC
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1) Eliminar objetos legacy/no usados
-- -----------------------------------------------------

-- Funciones legacy potencialmente riesgosas o sin uso actual
DROP FUNCTION IF EXISTS public.create_tenant_with_admin(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.refresh_tenant_stats();

-- Vistas/materialized views legacy
DROP MATERIALIZED VIEW IF EXISTS public.tenant_stats CASCADE;

-- Tablas duplicadas o sin uso en el frontend actual
DROP TABLE IF EXISTS public.evidence CASCADE;
DROP TABLE IF EXISTS public.process_stages CASCADE;

-- Staging antiguo de catalogos (reemplazado por carga directa en Admin)
DROP TABLE IF EXISTS public.stg_action_types CASCADE;
DROP TABLE IF EXISTS public.stg_stage_sla CASCADE;
DROP TABLE IF EXISTS public.stg_conduct_catalog CASCADE;
DROP TABLE IF EXISTS public.stg_conduct_types CASCADE;
DROP TABLE IF EXISTS public.catalog_staging_batches CASCADE;

-- Versionado legacy no usado por frontend actual
DROP TABLE IF EXISTS public.tenant_versions CASCADE;
DROP TABLE IF EXISTS public.platform_versions CASCADE;

-- -----------------------------------------------------
-- 2) Limpiar columnas legacy en cases
-- -----------------------------------------------------
ALTER TABLE public.cases DROP COLUMN IF EXISTS actions_taken;
ALTER TABLE public.cases DROP COLUMN IF EXISTS guardian_notified;
ALTER TABLE public.cases DROP COLUMN IF EXISTS student_name;

-- -----------------------------------------------------
-- 3) Afinar stage_sla (evitar constraint redundante)
-- -----------------------------------------------------
ALTER TABLE public.stage_sla DROP CONSTRAINT IF EXISTS uq_stage_sla_stage_key;

-- -----------------------------------------------------
-- 4) RLS coherente para tablas globales recreadas (29/30)
-- -----------------------------------------------------
ALTER TABLE public.conduct_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_sla ENABLE ROW LEVEL SECURITY;

-- conduct_types
DROP POLICY IF EXISTS conduct_types_select ON public.conduct_types;
DROP POLICY IF EXISTS conduct_types_manage ON public.conduct_types;
DROP POLICY IF EXISTS conduct_types_global_select ON public.conduct_types;
DROP POLICY IF EXISTS conduct_types_global_manage ON public.conduct_types;

CREATE POLICY conduct_types_global_select
ON public.conduct_types
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY conduct_types_global_manage
ON public.conduct_types
FOR ALL
USING (public.is_tenant_admin() = TRUE OR public.is_platform_admin() = TRUE)
WITH CHECK (public.is_tenant_admin() = TRUE OR public.is_platform_admin() = TRUE);

-- conduct_catalog
DROP POLICY IF EXISTS conduct_catalog_select ON public.conduct_catalog;
DROP POLICY IF EXISTS conduct_catalog_manage ON public.conduct_catalog;
DROP POLICY IF EXISTS conduct_catalog_global_select ON public.conduct_catalog;
DROP POLICY IF EXISTS conduct_catalog_global_manage ON public.conduct_catalog;

CREATE POLICY conduct_catalog_global_select
ON public.conduct_catalog
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY conduct_catalog_global_manage
ON public.conduct_catalog
FOR ALL
USING (public.is_tenant_admin() = TRUE OR public.is_platform_admin() = TRUE)
WITH CHECK (public.is_tenant_admin() = TRUE OR public.is_platform_admin() = TRUE);

-- stage_sla
DROP POLICY IF EXISTS sla_select ON public.stage_sla;
DROP POLICY IF EXISTS sla_manage ON public.stage_sla;
DROP POLICY IF EXISTS stage_sla_global_select ON public.stage_sla;
DROP POLICY IF EXISTS stage_sla_global_manage ON public.stage_sla;

CREATE POLICY stage_sla_global_select
ON public.stage_sla
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY stage_sla_global_manage
ON public.stage_sla
FOR ALL
USING (public.is_tenant_admin() = TRUE OR public.is_platform_admin() = TRUE)
WITH CHECK (public.is_tenant_admin() = TRUE OR public.is_platform_admin() = TRUE);

-- -----------------------------------------------------
-- 5) Indices útiles para esquema actual global
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_conduct_types_active_sort
  ON public.conduct_types (active, sort_order);

CREATE INDEX IF NOT EXISTS idx_conduct_catalog_active_sort
  ON public.conduct_catalog (active, sort_order);

CREATE INDEX IF NOT EXISTS idx_stage_sla_days_to_due
  ON public.stage_sla (days_to_due);

-- -----------------------------------------------------
-- 6) RPC compat: validate_college_catalogs (stub)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_college_catalogs(
  p_tenant_id uuid,
  p_batch_id uuid DEFAULT NULL
)
RETURNS TABLE(section text, row_ref text, error_code text, error_detail text)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Staging fue retirado. Se mantiene la firma por compatibilidad.
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_college_catalogs(uuid, uuid)
TO authenticated, service_role;

-- -----------------------------------------------------
-- 7) RPC compat: apply_college_catalogs adaptada al esquema actual
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_college_catalogs(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
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

  -- conduct_types global
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

  -- conduct_catalog global
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

  -- stage_sla global
  INSERT INTO public.stage_sla (stage_key, days_to_due)
  VALUES
    ('recepcion', 1),
    ('analisis', 2),
    ('investigacion', 3),
    ('resolucion', 2),
    ('seguimiento', 7)
  ON CONFLICT (stage_key) DO UPDATE
  SET days_to_due = EXCLUDED.days_to_due;

  -- action_types por tenant (mantiene aislamiento)
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

-- -----------------------------------------------------
-- 8) RPC compat: onboard_college simplificada y consistente
-- -----------------------------------------------------
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

COMMIT;
