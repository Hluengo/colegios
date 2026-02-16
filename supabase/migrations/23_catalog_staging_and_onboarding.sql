-- ============================================================
-- 23_catalog_staging_and_onboarding.sql
-- Baseline 2/2: staging + validaciones + publish + onboarding
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- Compatibilidad de columnas para modelo multi-tenant
-- ------------------------------------------------------------
ALTER TABLE public.conduct_types ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.conduct_types ADD COLUMN IF NOT EXISTS type_name text;
ALTER TABLE public.conduct_types ADD COLUMN IF NOT EXISTS type_category text;
ALTER TABLE public.conduct_types ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.conduct_types ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.conduct_types ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.conduct_catalog ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.conduct_catalog ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.conduct_catalog ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.conduct_catalog ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.stage_sla ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.stage_sla ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.action_types ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.action_types ADD COLUMN IF NOT EXISTS key text;
ALTER TABLE public.action_types ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.action_types ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.action_types ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.action_types ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Backfill columnas nuevas desde esquema legacy si existía (defensivo)
DO $$
DECLARE
  v_has_key boolean;
  v_has_label boolean;
  v_has_active boolean;
  v_sql text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conduct_types' AND column_name='key'
  ) INTO v_has_key;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conduct_types' AND column_name='label'
  ) INTO v_has_label;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conduct_types' AND column_name='active'
  ) INTO v_has_active;

  v_sql := 'UPDATE public.conduct_types SET '
    || 'type_name = COALESCE(type_name'
    || CASE WHEN v_has_key THEN ', key' ELSE '' END
    || CASE WHEN v_has_label THEN ', label' ELSE '' END
    || '), '
    || 'is_active = COALESCE(is_active'
    || CASE WHEN v_has_active THEN ', active' ELSE '' END
    || ', true), '
    || 'sort_order = COALESCE(sort_order, 0), '
    || 'updated_at = COALESCE(updated_at, now()) '
    || 'WHERE type_name IS NULL OR is_active IS NULL OR updated_at IS NULL';

  EXECUTE v_sql;
END $$;

DO $$
DECLARE
  v_has_active boolean;
  v_sql text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conduct_catalog' AND column_name='active'
  ) INTO v_has_active;

  v_sql := 'UPDATE public.conduct_catalog SET '
    || 'is_active = COALESCE(is_active'
    || CASE WHEN v_has_active THEN ', active' ELSE '' END
    || ', true), '
    || 'sort_order = COALESCE(sort_order, 0), '
    || 'updated_at = COALESCE(updated_at, now()) '
    || 'WHERE is_active IS NULL OR updated_at IS NULL';

  EXECUTE v_sql;
END $$;

DO $$
DECLARE
  v_has_name boolean;
  v_has_category boolean;
  v_has_active boolean;
  v_sql text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='action_types' AND column_name='name'
  ) INTO v_has_name;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='action_types' AND column_name='category'
  ) INTO v_has_category;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='action_types' AND column_name='active'
  ) INTO v_has_active;

  v_sql := 'UPDATE public.action_types SET '
    || 'key = COALESCE(key'
    || CASE WHEN v_has_name THEN ', name' ELSE '' END
    || '), '
    || 'label = COALESCE(label'
    || CASE WHEN v_has_name THEN ', name' ELSE '' END
    || '), '
    || 'description = COALESCE(description'
    || CASE WHEN v_has_category THEN ', category' ELSE '' END
    || '), '
    || 'is_active = COALESCE(is_active'
    || CASE WHEN v_has_active THEN ', active' ELSE '' END
    || ', true), '
    || 'sort_order = COALESCE(sort_order, 0) '
    || 'WHERE key IS NULL OR label IS NULL';

  EXECUTE v_sql;
END $$;

-- stage_sla pk por tenant+stage
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'stage_sla'
      AND constraint_name = 'stage_sla_pkey'
  ) THEN
    ALTER TABLE public.stage_sla DROP CONSTRAINT stage_sla_pkey;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stage_sla_pkey'
  ) THEN
    ALTER TABLE public.stage_sla
      ADD CONSTRAINT stage_sla_pkey PRIMARY KEY (tenant_id, stage_key);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_conduct_types_tenant_name
  ON public.conduct_types (tenant_id, type_name);

CREATE UNIQUE INDEX IF NOT EXISTS ux_conduct_catalog_tenant_type_category
  ON public.conduct_catalog (tenant_id, conduct_type, conduct_category);

CREATE UNIQUE INDEX IF NOT EXISTS ux_action_types_tenant_key
  ON public.action_types (tenant_id, key);

-- ------------------------------------------------------------
-- Staging tables
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.catalog_staging_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source_name text,
  uploaded_by uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'applied', 'error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.stg_conduct_types (
  id bigserial PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES public.catalog_staging_batches(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type_name text NOT NULL,
  type_category text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.stg_conduct_catalog (
  id bigserial PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES public.catalog_staging_batches(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conduct_type text NOT NULL,
  conduct_category text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.stg_stage_sla (
  id bigserial PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES public.catalog_staging_batches(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  days_to_due integer NOT NULL,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.stg_action_types (
  id bigserial PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES public.catalog_staging_batches(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- ------------------------------------------------------------
-- Validaciones
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_college_catalogs(
  p_tenant_id uuid,
  p_batch_id uuid DEFAULT NULL
)
RETURNS TABLE(section text, row_ref text, error_code text, error_detail text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_batch_id uuid;
BEGIN
  SELECT COALESCE(
    p_batch_id,
    (
      SELECT id
      FROM public.catalog_staging_batches
      WHERE tenant_id = p_tenant_id AND status = 'draft'
      ORDER BY created_at DESC
      LIMIT 1
    )
  ) INTO v_batch_id;

  IF v_batch_id IS NULL THEN
    RETURN QUERY SELECT 'batch', '-', 'NO_BATCH', 'No existe batch draft para el tenant';
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 'batch', '-', 'TENANT_MISMATCH', 'El batch no pertenece al tenant'
  WHERE EXISTS (
    SELECT 1
    FROM public.catalog_staging_batches
    WHERE id = v_batch_id
      AND tenant_id <> p_tenant_id
  );

  RETURN QUERY
  SELECT 'conduct_types', id::text, 'REQUIRED', 'type_name o type_category vacio'
  FROM public.stg_conduct_types
  WHERE batch_id = v_batch_id
    AND (btrim(type_name) = '' OR btrim(type_category) = '');

  RETURN QUERY
  SELECT 'conduct_catalog', id::text, 'REQUIRED', 'conduct_type o conduct_category vacio'
  FROM public.stg_conduct_catalog
  WHERE batch_id = v_batch_id
    AND (btrim(conduct_type) = '' OR btrim(conduct_category) = '');

  RETURN QUERY
  SELECT 'stage_sla', id::text, 'INVALID_DAYS', 'days_to_due debe ser >= 0'
  FROM public.stg_stage_sla
  WHERE batch_id = v_batch_id
    AND days_to_due < 0;

  RETURN QUERY
  SELECT 'action_types', id::text, 'REQUIRED', 'key o label vacio'
  FROM public.stg_action_types
  WHERE batch_id = v_batch_id
    AND (btrim(key) = '' OR btrim(label) = '');

  RETURN QUERY
  SELECT 'conduct_types', '-', 'DUPLICATE', 'type_name duplicado: ' || d.type_name
  FROM (
    SELECT lower(btrim(type_name)) AS type_name, count(*)
    FROM public.stg_conduct_types
    WHERE batch_id = v_batch_id
    GROUP BY 1
    HAVING count(*) > 1
  ) d;

  RETURN QUERY
  SELECT 'conduct_catalog', '-', 'DUPLICATE',
         'conduct_type/conduct_category duplicado: ' || d.conduct_type || ' / ' || d.conduct_category
  FROM (
    SELECT lower(btrim(conduct_type)) AS conduct_type,
           lower(btrim(conduct_category)) AS conduct_category,
           count(*)
    FROM public.stg_conduct_catalog
    WHERE batch_id = v_batch_id
    GROUP BY 1, 2
    HAVING count(*) > 1
  ) d;

  RETURN QUERY
  SELECT 'stage_sla', '-', 'DUPLICATE', 'stage_key duplicado: ' || d.stage_key
  FROM (
    SELECT lower(btrim(stage_key)) AS stage_key, count(*)
    FROM public.stg_stage_sla
    WHERE batch_id = v_batch_id
    GROUP BY 1
    HAVING count(*) > 1
  ) d;

  RETURN QUERY
  SELECT 'action_types', '-', 'DUPLICATE', 'key duplicado: ' || d.key
  FROM (
    SELECT lower(btrim(key)) AS key, count(*)
    FROM public.stg_action_types
    WHERE batch_id = v_batch_id
    GROUP BY 1
    HAVING count(*) > 1
  ) d;

  RETURN QUERY
  SELECT 'conduct_catalog', c.id::text, 'FK_TYPE_NOT_FOUND',
         'conduct_type no existe en stg_conduct_types: ' || c.conduct_type
  FROM public.stg_conduct_catalog c
  WHERE c.batch_id = v_batch_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.stg_conduct_types t
      WHERE t.batch_id = v_batch_id
        AND lower(btrim(t.type_name)) = lower(btrim(c.conduct_type))
    );
END;
$$;

-- ------------------------------------------------------------
-- Publicación one-click desde staging
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_college_catalogs(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_batch_id uuid;
  v_err_count int;
BEGIN
  SELECT id INTO v_batch_id
  FROM public.catalog_staging_batches
  WHERE tenant_id = p_tenant_id
    AND status = 'draft'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_batch_id IS NULL THEN
    RAISE EXCEPTION 'No existe batch draft para tenant %', p_tenant_id;
  END IF;

  SELECT count(*) INTO v_err_count
  FROM public.validate_college_catalogs(p_tenant_id, v_batch_id);

  IF v_err_count > 0 THEN
    UPDATE public.catalog_staging_batches
    SET status = 'error'
    WHERE id = v_batch_id;
    RAISE EXCEPTION 'Validacion fallida (% errores) para batch %', v_err_count, v_batch_id;
  END IF;

  UPDATE public.conduct_types t
  SET type_category = s.type_category,
      sort_order = COALESCE(s.sort_order, 0),
      is_active = COALESCE(s.is_active, true),
      updated_at = now()
  FROM public.stg_conduct_types s
  WHERE s.batch_id = v_batch_id
    AND t.tenant_id = p_tenant_id
    AND lower(btrim(t.type_name)) = lower(btrim(s.type_name));

  INSERT INTO public.conduct_types (tenant_id, type_name, type_category, sort_order, is_active)
  SELECT p_tenant_id, s.type_name, s.type_category, COALESCE(s.sort_order, 0), COALESCE(s.is_active, true)
  FROM public.stg_conduct_types s
  WHERE s.batch_id = v_batch_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.conduct_types t
      WHERE t.tenant_id = p_tenant_id
        AND lower(btrim(t.type_name)) = lower(btrim(s.type_name))
    );

  UPDATE public.conduct_types t
  SET is_active = false, updated_at = now()
  WHERE t.tenant_id = p_tenant_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.stg_conduct_types s
      WHERE s.batch_id = v_batch_id
        AND lower(btrim(s.type_name)) = lower(btrim(t.type_name))
    );

  UPDATE public.conduct_catalog c
  SET sort_order = COALESCE(s.sort_order, 0),
      is_active = COALESCE(s.is_active, true),
      updated_at = now()
  FROM public.stg_conduct_catalog s
  WHERE s.batch_id = v_batch_id
    AND c.tenant_id = p_tenant_id
    AND lower(btrim(c.conduct_type)) = lower(btrim(s.conduct_type))
    AND lower(btrim(c.conduct_category)) = lower(btrim(s.conduct_category));

  INSERT INTO public.conduct_catalog (tenant_id, conduct_type, conduct_category, sort_order, is_active)
  SELECT p_tenant_id, s.conduct_type, s.conduct_category, COALESCE(s.sort_order, 0), COALESCE(s.is_active, true)
  FROM public.stg_conduct_catalog s
  WHERE s.batch_id = v_batch_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.conduct_catalog c
      WHERE c.tenant_id = p_tenant_id
        AND lower(btrim(c.conduct_type)) = lower(btrim(s.conduct_type))
        AND lower(btrim(c.conduct_category)) = lower(btrim(s.conduct_category))
    );

  UPDATE public.conduct_catalog c
  SET is_active = false, updated_at = now()
  WHERE c.tenant_id = p_tenant_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.stg_conduct_catalog s
      WHERE s.batch_id = v_batch_id
        AND lower(btrim(s.conduct_type)) = lower(btrim(c.conduct_type))
        AND lower(btrim(s.conduct_category)) = lower(btrim(c.conduct_category))
    );

  DELETE FROM public.stage_sla WHERE tenant_id = p_tenant_id;
  INSERT INTO public.stage_sla (tenant_id, stage_key, days_to_due, is_active)
  SELECT p_tenant_id, s.stage_key, s.days_to_due, COALESCE(s.is_active, true)
  FROM public.stg_stage_sla s
  WHERE s.batch_id = v_batch_id;

  UPDATE public.action_types a
  SET label = s.label,
      description = s.description,
      sort_order = COALESCE(s.sort_order, 0),
      is_active = COALESCE(s.is_active, true)
  FROM public.stg_action_types s
  WHERE s.batch_id = v_batch_id
    AND a.tenant_id = p_tenant_id
    AND lower(btrim(a.key)) = lower(btrim(s.key));

  INSERT INTO public.action_types (tenant_id, key, label, description, sort_order, is_active)
  SELECT p_tenant_id, s.key, s.label, s.description, COALESCE(s.sort_order, 0), COALESCE(s.is_active, true)
  FROM public.stg_action_types s
  WHERE s.batch_id = v_batch_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.action_types a
      WHERE a.tenant_id = p_tenant_id
        AND lower(btrim(a.key)) = lower(btrim(s.key))
    );

  UPDATE public.action_types a
  SET is_active = false
  WHERE a.tenant_id = p_tenant_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.stg_action_types s
      WHERE s.batch_id = v_batch_id
        AND lower(btrim(s.key)) = lower(btrim(a.key))
    );

  UPDATE public.catalog_staging_batches
  SET status = 'applied',
      applied_at = now()
  WHERE id = v_batch_id;

  RETURN jsonb_build_object(
    'ok', true,
    'tenant_id', p_tenant_id,
    'batch_id', v_batch_id,
    'applied_at', now()
  );
END;
$$;

-- ------------------------------------------------------------
-- Onboarding automático (tenant + staging defaults + apply)
-- ------------------------------------------------------------
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
  v_batch_id uuid;
  v_version_id uuid;
BEGIN
  INSERT INTO public.tenants (
    slug, name, email, subscription_status, subscription_plan, trial_end_date, is_active
  )
  VALUES (
    lower(p_slug), p_name, p_email, 'trial', p_subscription_plan, now() + (p_trial_days || ' days')::interval, true
  )
  ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      email = EXCLUDED.email
  RETURNING id INTO v_tenant_id;

  SELECT id INTO v_version_id
  FROM public.platform_versions
  WHERE is_active = true
  ORDER BY released_at DESC
  LIMIT 1;

  IF v_version_id IS NOT NULL THEN
    INSERT INTO public.tenant_versions (tenant_id, version_id, auto_update_enabled)
    VALUES (v_tenant_id, v_version_id, true)
    ON CONFLICT (tenant_id) DO UPDATE
    SET version_id = EXCLUDED.version_id,
        auto_update_enabled = EXCLUDED.auto_update_enabled;
  END IF;

  INSERT INTO public.catalog_staging_batches (tenant_id, source_name, status)
  VALUES (v_tenant_id, 'onboarding_default_seed', 'draft')
  RETURNING id INTO v_batch_id;

  INSERT INTO public.stg_conduct_types (batch_id, tenant_id, type_name, type_category, sort_order, is_active)
  VALUES
    (v_batch_id,v_tenant_id,'Agresión Física','Gravísima',1,true),
    (v_batch_id,v_tenant_id,'Agresión Verbal','Grave',2,true),
    (v_batch_id,v_tenant_id,'Bullying','Gravísima',3,true),
    (v_batch_id,v_tenant_id,'Ciberbullying','Gravísima',4,true),
    (v_batch_id,v_tenant_id,'Robo','Grave',5,true),
    (v_batch_id,v_tenant_id,'Vandalismo','Grave',6,true),
    (v_batch_id,v_tenant_id,'Consumo de Sustancias','Gravísima',7,true),
    (v_batch_id,v_tenant_id,'Falta de Respeto','Leve',8,true),
    (v_batch_id,v_tenant_id,'Otro','Leve',99,true);

  INSERT INTO public.stg_conduct_catalog (batch_id, tenant_id, conduct_type, conduct_category, sort_order, is_active)
  VALUES
    (v_batch_id,v_tenant_id,'Agresión Física','Golpear',1,true),
    (v_batch_id,v_tenant_id,'Agresión Física','Empujar',2,true),
    (v_batch_id,v_tenant_id,'Agresión Física','Patear',3,true),
    (v_batch_id,v_tenant_id,'Agresión Verbal','Insultar',1,true),
    (v_batch_id,v_tenant_id,'Agresión Verbal','Humillar',2,true),
    (v_batch_id,v_tenant_id,'Agresión Verbal','Amenazar',3,true),
    (v_batch_id,v_tenant_id,'Bullying','Acoso continuo',1,true),
    (v_batch_id,v_tenant_id,'Bullying','Exclusión social',2,true),
    (v_batch_id,v_tenant_id,'Robo','Hurto',1,true),
    (v_batch_id,v_tenant_id,'Robo','Extorsión',2,true),
    (v_batch_id,v_tenant_id,'Falta de Respeto','Interrupción',1,true),
    (v_batch_id,v_tenant_id,'Falta de Respeto','Desobediencia',2,true),
    (v_batch_id,v_tenant_id,'Otro','Otro',99,true);

  INSERT INTO public.stg_stage_sla (batch_id, tenant_id, stage_key, days_to_due, is_active)
  VALUES
    (v_batch_id,v_tenant_id,'recepcion',1,true),
    (v_batch_id,v_tenant_id,'analisis',2,true),
    (v_batch_id,v_tenant_id,'investigacion',3,true),
    (v_batch_id,v_tenant_id,'resolucion',2,true),
    (v_batch_id,v_tenant_id,'seguimiento',7,true);

  INSERT INTO public.stg_action_types (batch_id, tenant_id, key, label, description, sort_order, is_active)
  VALUES
    (v_batch_id,v_tenant_id,'seguimiento','Seguimiento','Seguimiento general',1,true),
    (v_batch_id,v_tenant_id,'entrevista','Entrevista','Entrevista con involucrados',2,true),
    (v_batch_id,v_tenant_id,'citacion','Citación','Citación formal',3,true),
    (v_batch_id,v_tenant_id,'derivacion','Derivación','Derivación a especialista',4,true),
    (v_batch_id,v_tenant_id,'medida_disciplinaria','Medida Disciplinaria','Aplicación de medida',5,true),
    (v_batch_id,v_tenant_id,'cierre','Cierre','Cierre del caso',6,true);

  PERFORM public.apply_college_catalogs(v_tenant_id);

  IF p_admin_user_id IS NOT NULL THEN
    UPDATE public.tenant_profiles
    SET tenant_id = v_tenant_id,
        role = 'tenant_admin',
        is_active = true
    WHERE id = p_admin_user_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'tenant_id', v_tenant_id,
    'batch_id', v_batch_id,
    'slug', lower(p_slug)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_college_catalogs(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_college_catalogs(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onboard_college(text, text, text, uuid, text, integer) TO authenticated, service_role;

SELECT 'OK: staging + validate/apply + onboarding ready' AS status;
