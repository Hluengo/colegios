-- =====================================================
-- 19_tenant_indexes.sql
-- Indices multi-tenant coherentes con el esquema actual
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tenants_slug_active
  ON tenants(slug)
  WHERE deleted_at IS NULL AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_tenants_status
  ON tenants(subscription_status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_plan
  ON tenants(subscription_plan)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_students_tenant_id ON students(tenant_id);
CREATE INDEX IF NOT EXISTS idx_students_tenant_name ON students(tenant_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_students_tenant_level ON students(tenant_id, level);
CREATE INDEX IF NOT EXISTS idx_students_tenant_course ON students(tenant_id, course);
CREATE INDEX IF NOT EXISTS idx_students_tenant_rut ON students(tenant_id, rut) WHERE rut IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_fts ON students USING GIN (to_tsvector('spanish', coalesce(first_name,'') || ' ' || coalesce(last_name,'')));

CREATE INDEX IF NOT EXISTS idx_cases_tenant_id ON cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_status ON cases(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_date ON cases(tenant_id, incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_student ON cases(tenant_id, student_id);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_category ON cases(tenant_id, conduct_category);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_type ON cases(tenant_id, conduct_type);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_created ON cases(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_followups ON cases(tenant_id, seguimiento_started_at) WHERE seguimiento_started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_tenant_closed ON cases(tenant_id, closed_at) WHERE closed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_tenant_indagacion ON cases(tenant_id, indagacion_due_date) WHERE indagacion_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_fts ON cases USING GIN (to_tsvector('spanish', coalesce(short_description,'')));

CREATE INDEX IF NOT EXISTS idx_followups_tenant_id ON case_followups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_followups_tenant_case ON case_followups(tenant_id, case_id);
CREATE INDEX IF NOT EXISTS idx_followups_tenant_date ON case_followups(tenant_id, action_date DESC);
CREATE INDEX IF NOT EXISTS idx_followups_tenant_stage ON case_followups(tenant_id, process_stage);
CREATE INDEX IF NOT EXISTS idx_followups_tenant_due ON case_followups(tenant_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_followups_tenant_case_date ON case_followups(tenant_id, case_id, action_date DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_tenant_id ON followup_evidence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_tenant_case ON followup_evidence(tenant_id, case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_tenant_followup ON followup_evidence(tenant_id, followup_id);
CREATE INDEX IF NOT EXISTS idx_evidence_tenant_type ON followup_evidence(tenant_id, content_type);

CREATE INDEX IF NOT EXISTS idx_stages_tenant_id ON process_stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stages_tenant_order ON process_stages(tenant_id, stage_order);

CREATE INDEX IF NOT EXISTS idx_sla_tenant_id ON stage_sla(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sla_tenant_stage ON stage_sla(tenant_id, stage_key);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'involucrados' AND column_name = 'tenant_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_involucrados_tenant_id ON involucrados(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_involucrados_tenant_case ON involucrados(tenant_id, case_id);
    CREATE INDEX IF NOT EXISTS idx_involucrados_tenant_rol ON involucrados(tenant_id, rol);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conduct_catalog_tenant_type ON conduct_catalog(tenant_id, conduct_type, sort_order);
CREATE INDEX IF NOT EXISTS idx_conduct_types_tenant ON conduct_types(tenant_id, type_name);
CREATE INDEX IF NOT EXISTS idx_action_types_tenant ON action_types(tenant_id, key);

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant_id ON tenant_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant_email ON tenant_profiles(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant_role ON tenant_profiles(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_user_tenant ON tenant_profiles(id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_catalogs_tenant ON tenant_catalogs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_catalogs_type ON tenant_catalogs(tenant_id, catalog_type, display_order);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_date ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(tenant_id, action, created_at DESC);

DROP MATERIALIZED VIEW IF EXISTS tenant_stats CASCADE;
CREATE MATERIALIZED VIEW tenant_stats AS
SELECT
  t.id AS tenant_id,
  t.slug AS tenant_slug,
  t.name AS tenant_name,
  t.subscription_status,
  t.subscription_plan,
  COUNT(DISTINCT s.id)::INTEGER AS total_students,
  COUNT(DISTINCT c.id)::INTEGER AS total_cases,
  COUNT(CASE WHEN c.status = 'Reportado' THEN 1 END)::INTEGER AS casos_reportados,
  COUNT(CASE WHEN c.status = 'En Seguimiento' THEN 1 END)::INTEGER AS casos_en_seguimiento,
  COUNT(CASE WHEN c.status = 'Cerrado' THEN 1 END)::INTEGER AS casos_cerrados,
  COUNT(CASE WHEN c.conduct_category = 'Leve' THEN 1 END)::INTEGER AS casos_leves,
  COUNT(CASE WHEN c.conduct_category = 'Grave' THEN 1 END)::INTEGER AS casos_graves,
  COUNT(CASE WHEN c.conduct_category = 'Gravísima' THEN 1 END)::INTEGER AS casos_gravisima,
  MAX(c.created_at) AS ultimo_caso_fecha,
  COUNT(DISTINCT p.id)::INTEGER AS total_usuarios,
  NOW() AS refreshed_at
FROM tenants t
LEFT JOIN students s ON s.tenant_id = t.id
LEFT JOIN cases c ON c.tenant_id = t.id
LEFT JOIN tenant_profiles p ON p.tenant_id = t.id AND p.is_active = TRUE
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.slug, t.name, t.subscription_status, t.subscription_plan;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_stats_pk ON tenant_stats(tenant_id);

CREATE OR REPLACE FUNCTION refresh_tenant_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_stats;
END;
$$ LANGUAGE plpgsql;
