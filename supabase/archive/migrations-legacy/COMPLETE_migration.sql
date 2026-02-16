-- =====================================================
-- COMPLETE_migration.sql
-- Script unificado coherente (PART1 -> PART6)
-- =====================================================

-- ===== BEGIN supabase/migrations/PART1_tables_no_auth.sql =====
-- =====================================================
-- PARTE 1: TABLAS BASE (ESQUEMA COHERENTE)
-- Ejecutar primero en Supabase SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rut TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#1e40af',
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_end_date TIMESTAMPTZ,
  max_students INTEGER DEFAULT 500,
  max_users INTEGER DEFAULT 10,
  max_cases_per_month INTEGER DEFAULT 100,
  storage_mb INTEGER DEFAULT 1000,
  timezone TEXT DEFAULT 'America/Santiago',
  locale TEXT DEFAULT 'es-CL',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tenant_profiles (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('platform_admin', 'tenant_admin', 'user', 'readonly')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id, tenant_id)
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  rut TEXT,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  level TEXT,
  course TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_time TEXT DEFAULT '',
  course_incident TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Reportado',
  conduct_type TEXT DEFAULT '',
  conduct_category TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  actions_taken TEXT DEFAULT '',
  responsible TEXT DEFAULT '',
  responsible_role TEXT DEFAULT '',
  guardian_notified BOOLEAN DEFAULT FALSE,
  indagacion_start_date DATE,
  indagacion_due_date DATE,
  seguimiento_started_at TIMESTAMPTZ,
  legacy_case_number TEXT,
  student_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS case_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'Seguimiento',
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  process_stage TEXT NOT NULL DEFAULT 'Seguimiento',
  due_date DATE,
  due_at TIMESTAMPTZ,
  detail TEXT DEFAULT '',
  description TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  responsible TEXT DEFAULT '',
  action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS followup_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  followup_id UUID REFERENCES case_followups(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'evidencias',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS process_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stage_sla (
  stage_key TEXT PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  days_to_due INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS conduct_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  type_name TEXT NOT NULL,
  type_category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, type_name)
);

CREATE TABLE IF NOT EXISTS conduct_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  conduct_type TEXT NOT NULL,
  conduct_category TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, conduct_type, conduct_category)
);

CREATE TABLE IF NOT EXISTS action_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

CREATE TABLE IF NOT EXISTS case_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  process_stage TEXT,
  body TEXT NOT NULL,
  sender_name TEXT,
  sender_role TEXT,
  parent_id UUID,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_catalogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  catalog_type TEXT NOT NULL CHECK (catalog_type IN (
    'conduct_types', 'conduct_categories', 'courses', 'levels',
    'action_types', 'process_stages', 'roles', 'document_types', 'case_status'
  )),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, catalog_type, key)
);

CREATE TABLE IF NOT EXISTS tenant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, setting_key)
);

CREATE TABLE IF NOT EXISTS platform_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL UNIQUE,
  release_notes TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  breaking_changes JSONB DEFAULT '[]'::jsonb,
  min_plan TEXT DEFAULT 'basic',
  is_active BOOLEAN DEFAULT TRUE,
  is_mandatory BOOLEAN DEFAULT FALSE,
  released_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  version_id UUID REFERENCES platform_versions(id) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  auto_update_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(tenant_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT '✅ Parte 1 completada: tablas coherentes creadas' AS status;
-- ===== END supabase/migrations/PART1_tables_no_auth.sql =====


-- ===== BEGIN supabase/migrations/PART2_setup.sql =====
-- =====================================================
-- PARTE 2: INDICES, TRIGGERS Y RLS
-- Ejecutar despues de PART1
-- =====================================================

-- Compatibilidad con esquemas previos (tablas ya existentes sin sort_order)
ALTER TABLE conduct_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE conduct_catalog ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE action_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE case_followups ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
ALTER TABLE case_followups ADD COLUMN IF NOT EXISTS action_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_students_tenant_id ON students(tenant_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(tenant_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_date ON cases(tenant_id, incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_status ON cases(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_followups_tenant_case ON case_followups(tenant_id, case_id);
CREATE INDEX IF NOT EXISTS idx_followups_stage ON case_followups(tenant_id, process_stage);
CREATE INDEX IF NOT EXISTS idx_case_messages_case ON case_messages(tenant_id, case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_messages_parent ON case_messages(case_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_sla_tenant_stage ON stage_sla(tenant_id, stage_key);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant ON tenant_profiles(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_conduct_types_tenant ON conduct_types(tenant_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_conduct_catalog_tenant ON conduct_catalog(tenant_id, conduct_type, sort_order);
CREATE INDEX IF NOT EXISTS idx_action_types_tenant ON action_types(tenant_id, sort_order);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
DROP TRIGGER IF EXISTS update_case_followups_updated_at ON case_followups;
DROP TRIGGER IF EXISTS update_followup_evidence_updated_at ON followup_evidence;
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
DROP TRIGGER IF EXISTS update_tenant_profiles_updated_at ON tenant_profiles;

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_followups_updated_at BEFORE UPDATE ON case_followups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_followup_evidence_updated_at BEFORE UPDATE ON followup_evidence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_profiles_updated_at BEFORE UPDATE ON tenant_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- helpers RLS
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id
  FROM tenant_profiles
  WHERE id = auth.uid() AND is_active = TRUE
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_profiles
    WHERE id = auth.uid() AND role = 'platform_admin' AND is_active = TRUE
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_profiles
    WHERE id = auth.uid() AND role IN ('tenant_admin', 'platform_admin') AND is_active = TRUE
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE conduct_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_versions ENABLE ROW LEVEL SECURITY;

-- reemplazo idempotente de policies clave
DROP POLICY IF EXISTS tenant_profiles_select_own ON tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_select_tenant ON tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_insert_platform ON tenant_profiles;
CREATE POLICY tenant_profiles_select_own ON tenant_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY tenant_profiles_select_tenant ON tenant_profiles FOR SELECT USING (tenant_id = public.current_tenant_id() OR public.is_platform_admin() = TRUE);
CREATE POLICY tenant_profiles_insert_platform ON tenant_profiles FOR INSERT WITH CHECK (public.is_platform_admin() = TRUE);

DROP POLICY IF EXISTS tenant_isolation_students ON students;
DROP POLICY IF EXISTS tenant_isolation_cases ON cases;
DROP POLICY IF EXISTS tenant_isolation_followups ON case_followups;
DROP POLICY IF EXISTS tenant_isolation_evidence ON followup_evidence;
DROP POLICY IF EXISTS tenant_isolation_stages ON process_stages;
DROP POLICY IF EXISTS tenant_isolation_sla ON stage_sla;
DROP POLICY IF EXISTS tenant_isolation_catalog ON conduct_catalog;
DROP POLICY IF EXISTS tenant_isolation_types ON conduct_types;
DROP POLICY IF EXISTS tenant_isolation_actions ON action_types;
DROP POLICY IF EXISTS tenant_isolation_messages ON case_messages;

CREATE POLICY tenant_isolation_students ON students FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tenant_isolation_cases ON cases FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tenant_isolation_followups ON case_followups FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tenant_isolation_evidence ON followup_evidence FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tenant_isolation_stages ON process_stages FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tenant_isolation_sla ON stage_sla FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tenant_isolation_catalog ON conduct_catalog FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tenant_isolation_types ON conduct_types FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tenant_isolation_actions ON action_types FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY tenant_isolation_messages ON case_messages FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS versions_select ON platform_versions;
CREATE POLICY versions_select ON platform_versions FOR SELECT USING (TRUE);

SELECT '✅ Parte 2 completada: indices, triggers y RLS aplicada' AS status;
-- ===== END supabase/migrations/PART2_setup.sql =====


-- ===== BEGIN supabase/migrations/PART3_views_full.sql =====
-- =====================================================
-- PARTE 3: VISTAS (FULL)
-- =====================================================

CREATE OR REPLACE FUNCTION business_days_between(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
  days INTEGER := 0;
  curr_date DATE;
BEGIN
  IF start_date IS NULL OR end_date IS NULL THEN
    RETURN NULL;
  END IF;

  IF end_date < start_date THEN
    RETURN -business_days_between(end_date, start_date);
  END IF;

  curr_date := start_date;
  WHILE curr_date < end_date LOOP
    curr_date := curr_date + 1;
    IF EXTRACT(DOW FROM curr_date) NOT IN (0, 6) THEN
      days := days + 1;
    END IF;
  END LOOP;

  RETURN days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE VIEW public.v_control_unificado AS
WITH student_info AS (
  SELECT
    c.id AS case_id,
    c.student_id,
    TRIM(BOTH FROM (COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, ''))) AS estudiante,
    s.rut AS estudiante_rut,
    s.course,
    s.level
  FROM cases c
  LEFT JOIN students s ON s.id = c.student_id
),
last_followup AS (
  SELECT DISTINCT ON (f.case_id)
    f.id AS followup_id,
    f.case_id,
    f.action_date,
    f.action_type,
    f.responsible,
    f.detail,
    f.process_stage,
    f.description,
    COALESCE(f.due_date, f.due_at::date) AS due_date,
    f.created_at
  FROM case_followups f
  ORDER BY f.case_id, f.action_date DESC NULLS LAST, f.created_at DESC
),
seguimiento AS (
  SELECT
    'seguimiento'::text AS tipo,
    lf.followup_id,
    c.id AS case_id,
    c.legacy_case_number,
    c.status AS estado_caso,
    c.conduct_type AS tipificacion_conducta,
    c.incident_date AS fecha_incidente,
    c.course_incident AS curso_incidente,
    COALESCE(lf.action_date, c.created_at::date) AS fecha,
    lf.action_type AS tipo_accion,
    'Completada'::text AS estado_etapa,
    lf.responsible AS responsable,
    lf.detail AS detalle,
    lf.process_stage AS etapa_debido_proceso,
    lf.description AS descripcion,
    lf.due_date AS fecha_plazo,
    CASE WHEN lf.due_date IS NULL THEN NULL ELSE business_days_between(CURRENT_DATE, lf.due_date) END AS dias_restantes,
    CASE
      WHEN lf.due_date IS NULL THEN '⚪ Sin plazo'
      WHEN business_days_between(CURRENT_DATE, lf.due_date) < 0 THEN '🔴 Vencido'
      WHEN business_days_between(CURRENT_DATE, lf.due_date) <= 1 THEN '🟠 Urgente'
      WHEN business_days_between(CURRENT_DATE, lf.due_date) <= 3 THEN '🟡 Próximo'
      ELSE '🟢 OK'
    END AS alerta_urgencia,
    NULLIF((regexp_match(COALESCE(lf.process_stage,''), '^([0-9]+)\.'))[1], '')::integer AS stage_num_from,
    ss.days_to_due,
    si.student_id,
    NULLIF(si.estudiante, '') AS estudiante,
    si.estudiante_rut,
    si.course,
    si.level
  FROM cases c
  LEFT JOIN last_followup lf ON lf.case_id = c.id
  LEFT JOIN stage_sla ss ON ss.stage_key = lf.process_stage
  LEFT JOIN student_info si ON si.case_id = c.id
),
indagacion AS (
  SELECT
    'indagacion'::text AS tipo,
    lf.followup_id,
    c.id AS case_id,
    c.legacy_case_number,
    c.status AS estado_caso,
    c.conduct_type AS tipificacion_conducta,
    c.incident_date AS fecha_incidente,
    c.course_incident AS curso_incidente,
    c.indagacion_start_date AS fecha,
    NULL::text AS tipo_accion,
    NULL::text AS estado_etapa,
    NULL::text AS responsable,
    NULL::text AS detalle,
    lf.process_stage AS etapa_debido_proceso,
    NULL::text AS descripcion,
    c.indagacion_due_date AS fecha_plazo,
    CASE WHEN c.indagacion_due_date IS NULL THEN NULL ELSE business_days_between(CURRENT_DATE, c.indagacion_due_date) END AS dias_restantes,
    CASE
      WHEN c.indagacion_due_date IS NULL THEN '⚪ Sin plazo'
      WHEN business_days_between(CURRENT_DATE, c.indagacion_due_date) < 0 THEN '🔴 Vencido'
      WHEN business_days_between(CURRENT_DATE, c.indagacion_due_date) <= 1 THEN '🟠 Urgente'
      WHEN business_days_between(CURRENT_DATE, c.indagacion_due_date) <= 3 THEN '🟡 Próximo'
      ELSE '🟢 OK'
    END AS alerta_urgencia,
    NULL::integer AS stage_num_from,
    NULL::integer AS days_to_due,
    si.student_id,
    NULLIF(si.estudiante, '') AS estudiante,
    si.estudiante_rut,
    si.course,
    si.level
  FROM cases c
  LEFT JOIN last_followup lf ON lf.case_id = c.id
  LEFT JOIN student_info si ON si.case_id = c.id
  WHERE c.seguimiento_started_at IS NOT NULL
    AND c.indagacion_due_date IS NOT NULL
    AND COALESCE(c.status, '') <> 'Cerrado'
),
resumen AS (
  SELECT DISTINCT ON (c.id)
    'resumen'::text AS tipo,
    lf.followup_id,
    c.id AS case_id,
    NULL::integer AS legacy_case_number,
    NULL::text AS estado_caso,
    NULL::text AS tipificacion_conducta,
    NULL::date AS fecha_incidente,
    NULL::text AS curso_incidente,
    NULL::date AS fecha,
    NULL::text AS tipo_accion,
    NULL::text AS estado_etapa,
    NULL::text AS responsable,
    NULL::text AS detalle,
    NULL::text AS etapa_debido_proceso,
    NULL::text AS descripcion,
    COALESCE(lf.due_date, c.indagacion_due_date) AS fecha_plazo,
    CASE WHEN COALESCE(lf.due_date, c.indagacion_due_date) IS NULL THEN NULL ELSE business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date)) END AS dias_restantes,
    CASE
      WHEN COALESCE(lf.due_date, c.indagacion_due_date) IS NULL THEN '⚪ Sin plazo'
      WHEN business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date)) < 0 THEN '🔴 Vencido'
      WHEN business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date)) <= 1 THEN '🟠 Urgente'
      WHEN business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date)) <= 3 THEN '🟡 Próximo'
      ELSE '🟢 OK'
    END AS alerta_urgencia,
    NULL::integer AS stage_num_from,
    NULL::integer AS days_to_due,
    si.student_id,
    NULLIF(si.estudiante, '') AS estudiante,
    si.estudiante_rut,
    si.course,
    si.level
  FROM cases c
  LEFT JOIN last_followup lf ON lf.case_id = c.id
  LEFT JOIN student_info si ON si.case_id = c.id
  WHERE COALESCE(c.status, '') <> 'Cerrado'
  ORDER BY c.id, COALESCE(lf.due_date, c.indagacion_due_date) ASC NULLS LAST
)
SELECT * FROM seguimiento
UNION ALL
SELECT * FROM indagacion
UNION ALL
SELECT * FROM resumen;

GRANT SELECT ON public.v_control_unificado TO anon, authenticated;

SELECT '✅ Parte 3 FULL completada' AS status;
-- ===== END supabase/migrations/PART3_views_full.sql =====


-- ===== BEGIN supabase/migrations/PART4_seed_catalogs.sql =====
-- =====================================================
-- PARTE 4: SEED DE CATALOGOS (COHERENTE)
-- =====================================================

INSERT INTO tenants (slug, name, email, subscription_status, subscription_plan, trial_end_date)
VALUES ('demo', 'Colegio Demo', 'admin@demo.com', 'trial', 'professional', NOW() + INTERVAL '14 days')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_versions (version, release_notes, features, is_active, is_mandatory)
VALUES (
  '1.0.0',
  'Lanzamiento inicial de la plataforma SaaS multi-tenant',
  '["cases", "students", "followups", "reports", "basic-analytics"]'::jsonb,
  TRUE,
  TRUE
)
ON CONFLICT (version) DO NOTHING;

INSERT INTO conduct_types (tenant_id, type_name, type_category, sort_order, is_active)
SELECT t.id, c.type_name, c.type_category, c.sort_order, TRUE
FROM tenants t
CROSS JOIN (VALUES
  ('Agresión Física', 'Gravísima', 1),
  ('Agresión Verbal', 'Grave', 2),
  ('Bullying', 'Gravísima', 3),
  ('Ciberbullying', 'Gravísima', 4),
  ('Robo', 'Grave', 5),
  ('Vandalismo', 'Grave', 6),
  ('Consumo de Sustancias', 'Gravísima', 7),
  ('Falta de Respeto', 'Leve', 8),
  ('Otro', 'Leve', 99)
) AS c(type_name, type_category, sort_order)
WHERE t.slug = 'demo'
ON CONFLICT (tenant_id, type_name) DO UPDATE
SET type_category = EXCLUDED.type_category,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO conduct_catalog (tenant_id, conduct_type, conduct_category, sort_order, is_active)
SELECT t.id, c.conduct_type, c.conduct_category, c.sort_order, TRUE
FROM tenants t
CROSS JOIN (VALUES
  ('Agresión Física', 'Golpear', 1),
  ('Agresión Física', 'Empujar', 2),
  ('Agresión Física', 'Patear', 3),
  ('Agresión Verbal', 'Insultar', 1),
  ('Agresión Verbal', 'Humillar', 2),
  ('Agresión Verbal', 'Amenazar', 3),
  ('Bullying', 'Acoso continuo', 1),
  ('Bullying', 'Exclusión social', 2),
  ('Robo', 'Hurto', 1),
  ('Robo', 'Extorsión', 2),
  ('Falta de Respeto', 'Interrupción', 1),
  ('Falta de Respeto', 'Desobediencia', 2),
  ('Otro', 'Otro', 99)
) AS c(conduct_type, conduct_category, sort_order)
WHERE t.slug = 'demo'
ON CONFLICT (tenant_id, conduct_type, conduct_category) DO UPDATE
SET sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO action_types (tenant_id, key, label, description, is_active, sort_order)
SELECT t.id, a.key, a.label, a.description, TRUE, a.sort_order
FROM tenants t
CROSS JOIN (VALUES
  ('seguimiento', 'Seguimiento', 'Seguimiento general', 1),
  ('entrevista', 'Entrevista', 'Entrevista con involucrados', 2),
  ('citacion', 'Citación', 'Citación formal', 3),
  ('derivacion', 'Derivación', 'Derivación a especialista', 4),
  ('medida_disciplinaria', 'Medida Disciplinaria', 'Aplicación de medida', 5),
  ('cierre', 'Cierre', 'Cierre del caso', 6)
) AS a(key, label, description, sort_order)
WHERE t.slug = 'demo'
ON CONFLICT (tenant_id, key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

INSERT INTO stage_sla (stage_key, tenant_id, days_to_due, is_active)
SELECT s.stage_key, t.id, s.days_to_due, TRUE
FROM tenants t
CROSS JOIN (VALUES
  ('recepcion', 1),
  ('analisis', 2),
  ('investigacion', 3),
  ('resolucion', 2),
  ('seguimiento', 7)
) AS s(stage_key, days_to_due)
WHERE t.slug = 'demo'
ON CONFLICT (stage_key) DO NOTHING;

SELECT '✅ Parte 4 completada: seed aplicado' AS status;
-- ===== END supabase/migrations/PART4_seed_catalogs.sql =====


-- ===== BEGIN supabase/migrations/PART5_fix_catalogs_and_data.sql =====
-- =====================================================
-- PARTE 5: VERIFICACION Y AJUSTES FINALES
-- =====================================================

-- Asegurar sort_order si faltaba por despliegues antiguos
ALTER TABLE conduct_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE conduct_catalog ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE action_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Asegurar columnas de case_messages usadas por frontend
ALTER TABLE case_messages ADD COLUMN IF NOT EXISTS process_stage TEXT;
ALTER TABLE case_messages ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE case_messages ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE case_messages ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE case_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE case_messages ADD COLUMN IF NOT EXISTS sender_role TEXT;
ALTER TABLE case_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

SELECT '=== Conteos principales ===' AS info;
SELECT 'tenants' AS tabla, COUNT(*) AS total FROM tenants
UNION ALL SELECT 'tenant_profiles', COUNT(*) FROM tenant_profiles
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'cases', COUNT(*) FROM cases
UNION ALL SELECT 'case_followups', COUNT(*) FROM case_followups
UNION ALL SELECT 'conduct_types', COUNT(*) FROM conduct_types
UNION ALL SELECT 'conduct_catalog', COUNT(*) FROM conduct_catalog
UNION ALL SELECT 'action_types', COUNT(*) FROM action_types;

SELECT '✅ Parte 5 completada: verificacion/ajustes aplicados' AS status;
-- ===== END supabase/migrations/PART5_fix_catalogs_and_data.sql =====


-- ===== BEGIN supabase/migrations/PART6_create_app_tables.sql =====
-- =====================================================
-- PARTE 6: ALINEACION LEGACY (NO CREA MODELO ALTERNATIVO)
-- =====================================================

-- Este script se mantiene para compatibilidad historica.
-- Solo aplica alineaciones idempotentes y delega en el esquema canonico
-- definido en PART1/PART2 (tenant_profiles).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Alineaciones de tablas existentes
ALTER TABLE conduct_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE conduct_catalog ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE action_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- Alinear tenant_profiles si existe una version parcial
ALTER TABLE tenant_profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tenant_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE tenant_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE tenant_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

SELECT '✅ Parte 6 completada: alineacion legacy aplicada' AS status;
-- ===== END supabase/migrations/PART6_create_app_tables.sql =====

SELECT '✅ Migración completa coherente finalizada' AS status;
