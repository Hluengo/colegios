-- =====================================================
-- Seed mínimo de catálogos para un tenant específico
-- =====================================================
-- Tenant objetivo:
-- e8ef5cc3-86ba-4cc9-96c2-ff402139573a

-- Compatibilidad con esquemas legacy
ALTER TABLE public.conduct_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.conduct_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.conduct_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.conduct_catalog ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.conduct_catalog ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.conduct_catalog ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.stage_sla ADD COLUMN IF NOT EXISTS days_to_due INTEGER;
ALTER TABLE public.stage_sla ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.stage_sla ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

DO $$
DECLARE
  v_tenant_id UUID := 'e8ef5cc3-86ba-4cc9-96c2-ff402139573a';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant_id) THEN
    RAISE EXCEPTION 'Tenant % no existe', v_tenant_id;
  END IF;

  -- 1) conduct_types
  WITH src(type_name, type_category, sort_order, is_active) AS (
    VALUES
      ('Agresión Física', 'Gravísima', 1, TRUE),
      ('Agresión Verbal', 'Grave', 2, TRUE),
      ('Bullying', 'Gravísima', 3, TRUE),
      ('Ciberbullying', 'Gravísima', 4, TRUE),
      ('Robo', 'Grave', 5, TRUE),
      ('Vandalismo', 'Grave', 6, TRUE),
      ('Consumo de Sustancias', 'Gravísima', 7, TRUE),
      ('Falta de Respeto', 'Leve', 8, TRUE),
      ('Otro', 'Leve', 99, TRUE)
  )
  UPDATE public.conduct_types t
  SET type_category = s.type_category,
      sort_order = s.sort_order,
      is_active = s.is_active,
      updated_at = NOW()
  FROM src s
  WHERE t.tenant_id = v_tenant_id
    AND t.type_name = s.type_name;

  INSERT INTO public.conduct_types (tenant_id, type_name, type_category, sort_order, is_active)
  SELECT v_tenant_id, s.type_name, s.type_category, s.sort_order, s.is_active
  FROM (
    VALUES
      ('Agresión Física', 'Gravísima', 1, TRUE),
      ('Agresión Verbal', 'Grave', 2, TRUE),
      ('Bullying', 'Gravísima', 3, TRUE),
      ('Ciberbullying', 'Gravísima', 4, TRUE),
      ('Robo', 'Grave', 5, TRUE),
      ('Vandalismo', 'Grave', 6, TRUE),
      ('Consumo de Sustancias', 'Gravísima', 7, TRUE),
      ('Falta de Respeto', 'Leve', 8, TRUE),
      ('Otro', 'Leve', 99, TRUE)
  ) AS s(type_name, type_category, sort_order, is_active)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.conduct_types t
    WHERE t.tenant_id = v_tenant_id
      AND t.type_name = s.type_name
  );

  -- 2) conduct_catalog
  WITH src(conduct_type, conduct_category, sort_order, is_active) AS (
    VALUES
      ('Agresión Física', 'Golpear', 1, TRUE),
      ('Agresión Física', 'Empujar', 2, TRUE),
      ('Agresión Física', 'Patear', 3, TRUE),
      ('Agresión Verbal', 'Insultar', 1, TRUE),
      ('Agresión Verbal', 'Humillar', 2, TRUE),
      ('Agresión Verbal', 'Amenazar', 3, TRUE),
      ('Bullying', 'Acoso continuo', 1, TRUE),
      ('Bullying', 'Exclusión social', 2, TRUE),
      ('Robo', 'Hurto', 1, TRUE),
      ('Robo', 'Extorsión', 2, TRUE),
      ('Falta de Respeto', 'Interrupción', 1, TRUE),
      ('Falta de Respeto', 'Desobediencia', 2, TRUE),
      ('Otro', 'Otro', 99, TRUE)
  )
  UPDATE public.conduct_catalog c
  SET sort_order = s.sort_order,
      is_active = s.is_active,
      updated_at = NOW()
  FROM src s
  WHERE c.tenant_id = v_tenant_id
    AND c.conduct_type = s.conduct_type
    AND c.conduct_category = s.conduct_category;

  INSERT INTO public.conduct_catalog (tenant_id, conduct_type, conduct_category, sort_order, is_active)
  SELECT v_tenant_id, s.conduct_type, s.conduct_category, s.sort_order, s.is_active
  FROM (
    VALUES
      ('Agresión Física', 'Golpear', 1, TRUE),
      ('Agresión Física', 'Empujar', 2, TRUE),
      ('Agresión Física', 'Patear', 3, TRUE),
      ('Agresión Verbal', 'Insultar', 1, TRUE),
      ('Agresión Verbal', 'Humillar', 2, TRUE),
      ('Agresión Verbal', 'Amenazar', 3, TRUE),
      ('Bullying', 'Acoso continuo', 1, TRUE),
      ('Bullying', 'Exclusión social', 2, TRUE),
      ('Robo', 'Hurto', 1, TRUE),
      ('Robo', 'Extorsión', 2, TRUE),
      ('Falta de Respeto', 'Interrupción', 1, TRUE),
      ('Falta de Respeto', 'Desobediencia', 2, TRUE),
      ('Otro', 'Otro', 99, TRUE)
  ) AS s(conduct_type, conduct_category, sort_order, is_active)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.conduct_catalog c
    WHERE c.tenant_id = v_tenant_id
      AND c.conduct_type = s.conduct_type
      AND c.conduct_category = s.conduct_category
  );

  -- 3) stage_sla
  UPDATE public.stage_sla s
  SET tenant_id = v_tenant_id,
      days_to_due = v.days_to_due,
      is_active = TRUE
  FROM (
    VALUES
      ('recepcion', 1),
      ('analisis', 2),
      ('investigacion', 3),
      ('resolucion', 2),
      ('seguimiento', 7)
  ) AS v(stage_key, days_to_due)
  WHERE s.stage_key = v.stage_key;

  INSERT INTO public.stage_sla (stage_key, tenant_id, days_to_due, is_active)
  SELECT v.stage_key, v_tenant_id, v.days_to_due, TRUE
  FROM (
    VALUES
      ('recepcion', 1),
      ('analisis', 2),
      ('investigacion', 3),
      ('resolucion', 2),
      ('seguimiento', 7)
  ) AS v(stage_key, days_to_due)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.stage_sla s
    WHERE s.stage_key = v.stage_key
  );

  RAISE NOTICE 'Seed mínimo aplicado correctamente para tenant %', v_tenant_id;
END $$;

-- Verificación rápida
SELECT 'conduct_types' AS table_name, COUNT(*) AS total
FROM public.conduct_types
WHERE tenant_id = 'e8ef5cc3-86ba-4cc9-96c2-ff402139573a'
UNION ALL
SELECT 'conduct_catalog', COUNT(*)
FROM public.conduct_catalog
WHERE tenant_id = 'e8ef5cc3-86ba-4cc9-96c2-ff402139573a'
UNION ALL
SELECT 'stage_sla', COUNT(*)
FROM public.stage_sla
WHERE tenant_id = 'e8ef5cc3-86ba-4cc9-96c2-ff402139573a';
