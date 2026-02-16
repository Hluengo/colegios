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
