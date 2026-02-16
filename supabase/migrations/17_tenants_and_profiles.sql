-- =====================================================
-- 17_tenants_and_profiles.sql
-- Tablas principales para multi-tenancy (tenant_profiles canónico)
-- =====================================================

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
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(subscription_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant ON tenant_profiles(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_user ON tenant_profiles(id);
CREATE INDEX IF NOT EXISTS idx_tenant_catalogs_tenant_type ON tenant_catalogs(tenant_id, catalog_type);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  p_slug TEXT,
  p_name TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_password TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    jsonb_build_object('provider', 'email', 'role', 'tenant_admin'),
    jsonb_build_object('tenant_slug', p_slug)
  )
  RETURNING id INTO v_user_id;

  INSERT INTO tenants (slug, name, email, subscription_status, subscription_plan, trial_end_date)
  VALUES (p_slug, p_name, p_email, 'trial', 'basic', NOW() + INTERVAL '14 days')
  RETURNING id INTO v_tenant_id;

  INSERT INTO tenant_profiles (id, tenant_id, email, full_name, role)
  VALUES (v_user_id, v_tenant_id, p_email, p_full_name, 'tenant_admin');

  INSERT INTO tenant_versions (tenant_id, version_id)
  SELECT v_tenant_id, id
  FROM platform_versions
  WHERE is_active = TRUE
  ORDER BY released_at DESC
  LIMIT 1
  ON CONFLICT (tenant_id) DO NOTHING;

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_tenant_with_admin TO anon, authenticated;
