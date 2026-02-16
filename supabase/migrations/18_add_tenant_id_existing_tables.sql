-- =====================================================
-- 18_add_tenant_id_existing_tables.sql
-- Añadir tenant_id a todas las tablas existentes
-- IMPORTANTE: Ejecutar después de verificar que tenants funciona
-- =====================================================

-- =====================================================
-- Añadir tenant_id a students
-- =====================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Actualizar registros existentes con el tenant demo
UPDATE students SET tenant_id = (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE students ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- Añadir tenant_id a cases
-- =====================================================
ALTER TABLE cases ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

UPDATE cases SET tenant_id = (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE cases ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- Añadir tenant_id a case_followups
-- =====================================================
ALTER TABLE case_followups ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

UPDATE case_followups SET tenant_id = (SELECT t.id FROM cases c JOIN tenants t ON t.id = c.tenant_id WHERE c.id = case_followups.case_id LIMIT 1)
WHERE tenant_id IS NULL;

-- Si hay registros huérfanos, asignar al tenant demo
UPDATE case_followups SET tenant_id = (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE case_followups ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- Añadir tenant_id a followup_evidence
-- =====================================================
ALTER TABLE followup_evidence ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

UPDATE followup_evidence SET tenant_id = (SELECT t.id FROM cases c JOIN tenants t ON t.id = c.tenant_id WHERE c.id = followup_evidence.case_id LIMIT 1)
WHERE tenant_id IS NULL;

UPDATE followup_evidence SET tenant_id = (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE followup_evidence ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- Añadir tenant_id a process_stages
-- =====================================================
ALTER TABLE process_stages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

UPDATE process_stages SET tenant_id = (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE process_stages ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- Añadir tenant_id a stage_sla
-- =====================================================
ALTER TABLE stage_sla ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

UPDATE stage_sla SET tenant_id = (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE stage_sla ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- Añadir tenant_id a involucrados
-- =====================================================
-- Primero verificar si la columna existe con otro nombre
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'involucrados' AND column_name = 'case_id'
  ) THEN
    ALTER TABLE involucrados ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    
    UPDATE involucrados SET tenant_id = (
      SELECT t.id FROM cases c JOIN tenants t ON t.id = c.tenant_id 
      WHERE c.id = involucrados.case_id LIMIT 1
    )
    WHERE tenant_id IS NULL;
    
    UPDATE involucrados SET tenant_id = (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1)
    WHERE tenant_id IS NULL;
    
    ALTER TABLE involucrados ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- =====================================================
-- Añadir tenant_id a conduct_catalog
-- =====================================================
ALTER TABLE conduct_catalog ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

UPDATE conduct_catalog SET tenant_id = (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE conduct_catalog ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- Añadir tenant_id a conduct_types
-- =====================================================
ALTER TABLE conduct_types ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

UPDATE conduct_types SET tenant_id = (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE conduct_types ALTER COLUMN tenant_id SET NOT NULL;

-- =====================================================
-- Añadir tenant_id a case_messages (si existe)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'case_messages'
  ) THEN
    ALTER TABLE case_messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    
    UPDATE case_messages SET tenant_id = (
      SELECT t.id FROM cases c JOIN tenants t ON t.id = c.tenant_id 
      WHERE c.id = case_messages.case_id LIMIT 1
    )
    WHERE tenant_id IS NULL;
    
    UPDATE case_messages SET tenant_id = (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1)
    WHERE tenant_id IS NULL;
    
    ALTER TABLE case_messages ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- =====================================================
-- Fin de migración
-- =====================================================
