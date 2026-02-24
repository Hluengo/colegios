-- =====================================================
-- 21_create_all_app_tables.sql
-- Alineacion final de tablas de aplicacion (idempotente)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- tenant_profiles es canónico para la app
CREATE TABLE IF NOT EXISTS tenant_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('platform_admin', 'tenant_admin', 'user', 'readonly')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, tenant_id)
);

CREATE TABLE IF NOT EXISTS conduct_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  type_name TEXT NOT NULL,
  type_category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, type_name)
);

CREATE TABLE IF NOT EXISTS conduct_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  conduct_type TEXT NOT NULL,
  conduct_category TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, conduct_type, conduct_category)
);

CREATE TABLE IF NOT EXISTS action_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cases ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE case_followups ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE followup_evidence ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE stage_sla ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE process_stages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'involucrados' AND column_name = 'case_id'
  ) THEN
    ALTER TABLE involucrados ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- stage_sla compatible con 12_align_stage_sla_schema.sql (stage_key + days_to_due)
ALTER TABLE stage_sla ADD COLUMN IF NOT EXISTS stage_key TEXT;
ALTER TABLE stage_sla ADD COLUMN IF NOT EXISTS days_to_due INTEGER;

CREATE INDEX IF NOT EXISTS idx_conduct_types_tenant ON conduct_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conduct_catalog_tenant ON conduct_catalog(tenant_id);
CREATE INDEX IF NOT EXISTS idx_action_types_tenant ON action_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_case_messages_tenant ON case_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_tenant ON evidence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant ON tenant_profiles(tenant_id);

INSERT INTO conduct_types (tenant_id, type_name, type_category, is_active, sort_order)
SELECT t.id, c.type, c.category, true, c.sort_order
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
  ('Otro', 'Leve', 9)
) AS c(type, category, sort_order)
WHERE t.slug = 'demo'
ON CONFLICT (tenant_id, type_name) DO UPDATE
SET type_category = EXCLUDED.type_category,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO conduct_catalog (tenant_id, conduct_type, conduct_category, sort_order, is_active)
SELECT t.id, c.type, c.category, c.sort_order, true
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
) AS c(type, category, sort_order)
WHERE t.slug = 'demo'
ON CONFLICT (tenant_id, conduct_type, conduct_category) DO UPDATE
SET sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO stage_sla (tenant_id, stage_key, days_to_due)
SELECT t.id, s.stage_key, s.days_to_due
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

INSERT INTO action_types (tenant_id, key, label, description, is_active, sort_order)
SELECT t.id, a.key, a.label, a.description, true, a.sort_order
FROM tenants t
CROSS JOIN (VALUES
  ('citacion_apoderado', 'Citación a Apoderado', 'Citar al apoderado', 1),
  ('citacion_estudiante', 'Citación a Estudiante', 'Citar al estudiante', 2),
  ('entrevista', 'Entrevista', 'Realizar entrevista', 3),
  ('medida_disciplinaria', 'Medida Disciplinaria', 'Aplicar medida', 4),
  ('derivacion', 'Derivación', 'Derivar a especialista', 5),
  ('cierre', 'Cierre de Caso', 'Cerrar el caso', 6)
) AS a(key, label, description, sort_order)
WHERE t.slug = 'demo'
ON CONFLICT (tenant_id, key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

SELECT 'Migración de alineación completada' AS status;
