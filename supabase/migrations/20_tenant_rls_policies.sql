-- =====================================================
-- 20_tenant_rls_policies.sql
-- Políticas RLS para aislamiento multi-tenant
-- =====================================================

CREATE SCHEMA IF NOT EXISTS audit;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id::UUID
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

CREATE OR REPLACE FUNCTION public.can_access_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_platform_admin() THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM tenant_profiles
    WHERE id = auth.uid()
      AND tenant_id = p_tenant_id
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE conduct_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'involucrados' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE involucrados ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'case_messages'
  ) THEN
    ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'action_types'
  ) THEN
    ALTER TABLE action_types ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'evidence'
  ) THEN
    ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS tenants_select_platform ON tenants;
DROP POLICY IF EXISTS tenants_select_active ON tenants;
DROP POLICY IF EXISTS tenants_insert_platform ON tenants;
DROP POLICY IF EXISTS tenants_update_platform ON tenants;
DROP POLICY IF EXISTS tenants_delete_platform ON tenants;

CREATE POLICY tenants_select_platform ON tenants
  FOR SELECT USING (public.is_platform_admin() = TRUE);

CREATE POLICY tenants_select_active ON tenants
  FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);

CREATE POLICY tenants_insert_platform ON tenants
  FOR INSERT WITH CHECK (public.is_platform_admin() = TRUE);

CREATE POLICY tenants_update_platform ON tenants
  FOR UPDATE USING (public.is_platform_admin() = TRUE);

CREATE POLICY tenants_delete_platform ON tenants
  FOR DELETE USING (public.is_platform_admin() = TRUE);

DROP POLICY IF EXISTS tenant_profiles_select_own ON tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_select_platform ON tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_select_tenant ON tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_update_own ON tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_insert_platform ON tenant_profiles;

CREATE POLICY tenant_profiles_select_own ON tenant_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY tenant_profiles_select_platform ON tenant_profiles
  FOR SELECT USING (public.is_platform_admin() = TRUE);

CREATE POLICY tenant_profiles_select_tenant ON tenant_profiles
  FOR SELECT USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

CREATE POLICY tenant_profiles_update_own ON tenant_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY tenant_profiles_insert_platform ON tenant_profiles
  FOR INSERT WITH CHECK (public.is_platform_admin() = TRUE);

DROP POLICY IF EXISTS catalogs_select ON tenant_catalogs;
DROP POLICY IF EXISTS catalogs_manage ON tenant_catalogs;
DROP POLICY IF EXISTS settings_select ON tenant_settings;
DROP POLICY IF EXISTS settings_manage ON tenant_settings;

CREATE POLICY catalogs_select ON tenant_catalogs
  FOR SELECT USING (tenant_id = public.current_tenant_id() OR public.is_platform_admin() = TRUE);

CREATE POLICY catalogs_manage ON tenant_catalogs
  FOR ALL USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE)
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

CREATE POLICY settings_select ON tenant_settings
  FOR SELECT USING (tenant_id = public.current_tenant_id() OR public.is_platform_admin() = TRUE);

CREATE POLICY settings_manage ON tenant_settings
  FOR ALL USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE)
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

DROP POLICY IF EXISTS students_select ON students;
DROP POLICY IF EXISTS students_insert ON students;
DROP POLICY IF EXISTS students_update ON students;
DROP POLICY IF EXISTS students_delete ON students;

CREATE POLICY students_select ON students
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY students_insert ON students
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY students_update ON students
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY students_delete ON students
  FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

DROP POLICY IF EXISTS cases_select ON cases;
DROP POLICY IF EXISTS cases_insert ON cases;
DROP POLICY IF EXISTS cases_update ON cases;
DROP POLICY IF EXISTS cases_delete ON cases;

CREATE POLICY cases_select ON cases
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY cases_insert ON cases
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY cases_update ON cases
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY cases_delete ON cases
  FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

DROP POLICY IF EXISTS followups_select ON case_followups;
DROP POLICY IF EXISTS followups_insert ON case_followups;
DROP POLICY IF EXISTS followups_update ON case_followups;
DROP POLICY IF EXISTS followups_delete ON case_followups;

CREATE POLICY followups_select ON case_followups
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY followups_insert ON case_followups
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY followups_update ON case_followups
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY followups_delete ON case_followups
  FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

DROP POLICY IF EXISTS evidence_select ON followup_evidence;
DROP POLICY IF EXISTS evidence_insert ON followup_evidence;
DROP POLICY IF EXISTS evidence_update ON followup_evidence;
DROP POLICY IF EXISTS evidence_delete ON followup_evidence;

CREATE POLICY evidence_select ON followup_evidence
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY evidence_insert ON followup_evidence
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY evidence_update ON followup_evidence
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY evidence_delete ON followup_evidence
  FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

DROP POLICY IF EXISTS stages_select ON process_stages;
DROP POLICY IF EXISTS stages_manage ON process_stages;
DROP POLICY IF EXISTS sla_select ON stage_sla;
DROP POLICY IF EXISTS sla_manage ON stage_sla;
DROP POLICY IF EXISTS conduct_catalog_select ON conduct_catalog;
DROP POLICY IF EXISTS conduct_catalog_manage ON conduct_catalog;
DROP POLICY IF EXISTS conduct_types_select ON conduct_types;
DROP POLICY IF EXISTS conduct_types_manage ON conduct_types;

CREATE POLICY stages_select ON process_stages
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY stages_manage ON process_stages
  FOR ALL USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE)
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

CREATE POLICY sla_select ON stage_sla
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY sla_manage ON stage_sla
  FOR ALL USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE)
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

CREATE POLICY conduct_catalog_select ON conduct_catalog
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY conduct_catalog_manage ON conduct_catalog
  FOR ALL USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE)
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

CREATE POLICY conduct_types_select ON conduct_types
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY conduct_types_manage ON conduct_types
  FOR ALL USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE)
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

DROP POLICY IF EXISTS audit_select ON audit_logs;
DROP POLICY IF EXISTS audit_insert ON audit_logs;
DROP POLICY IF EXISTS versions_select ON platform_versions;
DROP POLICY IF EXISTS versions_manage ON platform_versions;
DROP POLICY IF EXISTS tenant_versions_select ON tenant_versions;
DROP POLICY IF EXISTS tenant_versions_manage ON tenant_versions;

CREATE POLICY audit_select ON audit_logs
  FOR SELECT USING (tenant_id = public.current_tenant_id() OR public.is_platform_admin() = TRUE);
CREATE POLICY audit_insert ON audit_logs
  FOR INSERT WITH CHECK (public.is_platform_admin() = TRUE);

CREATE POLICY versions_select ON platform_versions
  FOR SELECT USING (TRUE);
CREATE POLICY versions_manage ON platform_versions
  FOR ALL USING (public.is_platform_admin() = TRUE)
  WITH CHECK (public.is_platform_admin() = TRUE);

CREATE POLICY tenant_versions_select ON tenant_versions
  FOR SELECT USING (tenant_id = public.current_tenant_id() OR public.is_platform_admin() = TRUE);
CREATE POLICY tenant_versions_manage ON tenant_versions
  FOR ALL USING (public.is_platform_admin() = TRUE)
  WITH CHECK (public.is_platform_admin() = TRUE);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'involucrados' AND column_name = 'tenant_id'
  ) THEN
    DROP POLICY IF EXISTS involucrados_select ON involucrados;
    DROP POLICY IF EXISTS involucrados_insert ON involucrados;
    DROP POLICY IF EXISTS involucrados_update ON involucrados;
    DROP POLICY IF EXISTS involucrados_delete ON involucrados;

    CREATE POLICY involucrados_select ON involucrados
      FOR SELECT USING (tenant_id = public.current_tenant_id());
    CREATE POLICY involucrados_insert ON involucrados
      FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
    CREATE POLICY involucrados_update ON involucrados
      FOR UPDATE USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
    CREATE POLICY involucrados_delete ON involucrados
      FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'case_messages'
  ) THEN
    DROP POLICY IF EXISTS case_messages_select ON case_messages;
    DROP POLICY IF EXISTS case_messages_insert ON case_messages;
    DROP POLICY IF EXISTS case_messages_update ON case_messages;
    DROP POLICY IF EXISTS case_messages_delete ON case_messages;

    CREATE POLICY case_messages_select ON case_messages
      FOR SELECT USING (tenant_id = public.current_tenant_id());
    CREATE POLICY case_messages_insert ON case_messages
      FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
    CREATE POLICY case_messages_update ON case_messages
      FOR UPDATE USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
    CREATE POLICY case_messages_delete ON case_messages
      FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'action_types'
  ) THEN
    DROP POLICY IF EXISTS action_types_select ON action_types;
    DROP POLICY IF EXISTS action_types_insert ON action_types;
    DROP POLICY IF EXISTS action_types_update ON action_types;
    DROP POLICY IF EXISTS action_types_delete ON action_types;

    CREATE POLICY action_types_select ON action_types
      FOR SELECT USING (tenant_id = public.current_tenant_id());
    CREATE POLICY action_types_insert ON action_types
      FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
    CREATE POLICY action_types_update ON action_types
      FOR UPDATE USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
    CREATE POLICY action_types_delete ON action_types
      FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION audit.if_modified_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (tenant_id, user_id, action, table_name, record_id, new_values, ip_address)
    VALUES (
      COALESCE(NEW.tenant_id, public.current_tenant_id()),
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW),
      (SELECT auth.jwt() ->> 'ip_address')
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (tenant_id, user_id, action, table_name, record_id, old_values, new_values, ip_address)
    VALUES (
      COALESCE(NEW.tenant_id, public.current_tenant_id()),
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      (SELECT auth.jwt() ->> 'ip_address')
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (tenant_id, user_id, action, table_name, record_id, old_values, ip_address)
    VALUES (
      COALESCE(OLD.tenant_id, public.current_tenant_id()),
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      (SELECT auth.jwt() ->> 'ip_address')
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_cases ON cases;
CREATE TRIGGER audit_cases
AFTER INSERT OR UPDATE OR DELETE ON cases
FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func();
