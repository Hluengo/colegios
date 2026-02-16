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
