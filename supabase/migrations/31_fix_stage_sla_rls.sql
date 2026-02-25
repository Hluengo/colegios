-- =====================================================
-- 31_fix_stage_sla_rls.sql
-- Fix RLS policies for stage_sla table
-- =====================================================

-- Add tenant_id column if it doesn't exist
ALTER TABLE stage_sla ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Populate tenant_id with a default value for existing records
-- This assumes stage_sla is global, but RLS requires tenant context
UPDATE stage_sla SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL and add default
ALTER TABLE stage_sla 
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;

-- Drop old policies that reference missing tenant_id
DROP POLICY IF EXISTS sla_select ON stage_sla;
DROP POLICY IF EXISTS sla_manage ON stage_sla;

-- Create new policies that allow platform admins to manage SLA
-- (without requiring matching tenant_id since SLA is global config)
CREATE POLICY sla_select ON stage_sla
  FOR SELECT USING (
    -- Allow all authenticated users to read SLA
    auth.role() = 'authenticated'
  );

CREATE POLICY sla_manage ON stage_sla
  FOR ALL USING (
    -- Only platform admins can modify SLA
    EXISTS (
      SELECT 1 FROM tenant_profiles tp
      WHERE tp.id = auth.uid()
      AND tp.role = 'platform_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_profiles tp
      WHERE tp.id = auth.uid()
      AND tp.role = 'platform_admin'
    )
  );
