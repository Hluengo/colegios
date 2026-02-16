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
