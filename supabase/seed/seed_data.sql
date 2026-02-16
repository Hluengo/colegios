-- =====================================================
-- Datos de Prueba para Supabase
-- Sistema de Gestión de Convivencia Escolar
-- =====================================================

-- Obtener el tenant_id del tenant demo
-- Ejecutar primero para obtener el ID
DO $$ 
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'demo' LIMIT 1;
  
  -- Si no existe, crear uno
  IF v_tenant_id IS NULL THEN
    INSERT INTO tenants (slug, legal_name, display_name, status, subscription_plan, subscription_status, primary_color, secondary_color)
    VALUES ('demo', 'Colegio Demo', 'Colegio Demo', 'active', 'professional', 'active', '#3B82F6', '#1E40AF')
    RETURNING id INTO v_tenant_id;
  END IF;
  
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
END $$;

-- =====================================================
-- 1. STUDENTS (20 registros)
-- =====================================================
INSERT INTO students (tenant_id, first_name, last_name, rut, course, level) VALUES
('{TENANT_ID}', 'Juan', 'Pérez García', '12345678-5', '1° Básico', 'Básico'),
('{TENANT_ID}', 'María', 'López Hernández', '23456789-0', '2° Básico', 'Básico'),
('{TENANT_ID}', 'Pedro', 'González Müller', '34567890-1', '3° Básico', 'Básico'),
('{TENANT_ID}', 'Ana', 'Martínez Sánchez', '45678901-2', '4° Básico', 'Básico'),
('{TENANT_ID}', 'Carlos', 'Rodríguez Díaz', '56789012-3', '5° Básico', 'Básico'),
('{TENANT_ID}', 'Sofía', 'Fernández Torres', '67890123-4', '6° Básico', 'Básico'),
('{TENANT_ID}', 'Diego', 'Ramírez Flores', '78901234-5', '7° Básico', 'Básico'),
('{TENANT_ID}', 'Isabella', 'Torres Rivera', '89012345-6', '8° Básico', 'Básico'),
('{TENANT_ID}', 'Miguel', 'Vargas Sánchez', '90123456-7', '1° Medio', 'Medio'),
('{TENANT_ID}', 'Valentina', 'Mendoza Castro', '01234567-8', '2° Medio', 'Medio'),
('{TENANT_ID}', 'Alejandro', 'Silva Ortega', '11223344-5', '3° Medio', 'Medio'),
('{TENANT_ID}', 'Camila', 'Aguilar Pérez', '22334455-6', '4° Medio', 'Medio'),
('{TENANT_ID}', 'Sebastián', 'Navarro Rojas', '33445566-7', '1° Básico', 'Básico'),
('{TENANT_ID}', 'Martina', 'Cortés Jiménez', '44556677-8', '2° Básico', 'Básico'),
('{TENANT_ID}', 'Gabriel', 'Becerra Luna', '55667788-9', '3° Básico', 'Básico'),
('{TENANT_ID}', 'Emilia', 'Reyes Gutiérrez', '66778899-0', '4° Básico', 'Básico'),
('{TENANT_ID}', 'Benjamín', 'Carrasco Miranda', '77889900-1', '5° Básico', 'Básico'),
('{TENANT_ID}', 'Catalina', 'Escobar Navarro', '88990011-2', '6° Básico', 'Básico'),
('{TENANT_ID}', 'Daniel', 'Arias Castillo', '99001122-3', '7° Básico', 'Básico'),
('{TENANT_ID}', 'Antonella', 'Vega Fuentes', '10111223-4', '8° Básico', 'Básico');

-- =====================================================
-- 2. CASES (20 registros)
-- =====================================================
INSERT INTO cases (tenant_id, student_id, incident_date, incident_time, course_incident, status, conduct_type, conduct_category, short_description, actions_taken, responsible, responsible_role, guardian_notified, indagacion_start_date, indagacion_due_date, seguimiento_started_at, legacy_case_number, student_name) 
SELECT 
  t.id,
  s.id,
  CURRENT_DATE - (random() * 30)::int,
  '10:30',
  s.course,
  (ARRAY['Reportado', 'En Seguimiento', 'Cerrado'])[floor(random() * 3 + 1)],
  (ARRAY['Agresión Física', 'Agresión Verbal', 'Bullying', 'Robo', 'Vandalismo', 'Falta de Respeto'])[floor(random() * 6 + 1)],
  (ARRAY['Leve', 'Grave', 'Muy Grave', 'Gravísima'])[floor(random() * 4 + 1)],
  'Incidente entre estudiantes en recreo',
  'Se realizó entrevista con involucrados',
  'Juan Pérez',
  'Inspector',
  true,
  CURRENT_DATE - (random() * 10)::int,
  CURRENT_DATE + (random() * 10)::int,
  CURRENT_DATE - (random() * 5)::int,
  'CASE-' || floor(random() * 9000 + 1000),
  s.first_name || ' ' || s.last_name
FROM students s, tenants t WHERE t.slug = 'demo'
LIMIT 20;

-- =====================================================
-- 3. CASE_FOLLOWUPS (30 registros)
-- =====================================================
INSERT INTO case_followups (tenant_id, case_id, action_date, action_type, process_stage, detail, responsible, observations, description, due_date, created_at)
SELECT 
  c.tenant_id,
  c.id,
  c.created_at + (random() * 7)::int * INTERVAL '1 day',
  (ARRAY['Entrevista', 'Citación', 'Derivación', 'Seguimiento', 'Medida Disciplinaria'])[floor(random() * 5 + 1)],
  '1. Recepción',
  'Se realizó entrevista con el estudiante',
  'Juan Pérez',
  'Estudiante colaborador',
  'Entrevista realizada con éxito',
  c.created_at + 10,
  c.created_at
FROM cases c
LIMIT 30;

-- =====================================================
-- 4. CONDUCT_TYPES (8 registros)
-- =====================================================
INSERT INTO conduct_types (tenant_id, type_name, type_category, is_active, sort_order) VALUES
('{TENANT_ID}', 'Agresión Física', 'Conducta Grave', true, 1),
('{TENANT_ID}', 'Agresión Verbal', 'Conducta Grave', true, 2),
('{TENANT_ID}', 'Bullying/Ciberbullying', 'Conducta Gravísima', true, 3),
('{TENANT_ID}', 'Robo', 'Conducta Grave', true, 4),
('{TENANT_ID}', 'Vandalismo', 'Conducta Grave', true, 5),
('{TENANT_ID}', 'Consumo de Sustancias', 'Conducta Gravísima', true, 6),
('{TENANT_ID}', 'Falta de Respeto', 'Conducta Leve', true, 7),
('{TENANT_ID}', 'Otro', 'Conducta Leve', true, 99);

-- =====================================================
-- 5. CONDUCT_CATALOG (16 registros)
-- =====================================================
INSERT INTO conduct_catalog (tenant_id, conduct_type, conduct_category, is_active, sort_order) VALUES
('{TENANT_ID}', 'Agresión Física', 'Leve', true, 1),
('{TENANT_ID}', 'Agresión Física', 'Grave', true, 2),
('{TENANT_ID}', 'Agresión Física', 'Muy Grave', true, 3),
('{TENANT_ID}', 'Agresión Verbal', 'Leve', true, 4),
('{TENANT_ID}', 'Agresión Verbal', 'Grave', true, 5),
('{TENANT_ID}', 'Bullying/Ciberbullying', 'Grave', true, 6),
('{TENANT_ID}', 'Bullying/Ciberbullying', 'Gravísima', true, 7),
('{TENANT_ID}', 'Robo', 'Grave', true, 8),
('{TENANT_ID}', 'Robo', 'Gravísima', true, 9),
('{TENANT_ID}', 'Vandalismo', 'Leve', true, 10),
('{TENANT_ID}', 'Vandalismo', 'Grave', true, 11),
('{TENANT_ID}', 'Consumo de Sustancias', 'Gravísima', true, 12),
('{TENANT_ID}', 'Falta de Respeto', 'Leve', true, 13),
('{TENANT_ID}', 'Falta de Respeto', 'Grave', true, 14),
('{TENANT_ID}', 'Otro', 'Leve', true, 15),
('{TENANT_ID}', 'Otro', 'Grave', true, 16);

-- =====================================================
-- 6. ACTION_TYPES (6 registros)
-- =====================================================
INSERT INTO action_types (tenant_id, key, label, is_active, sort_order) VALUES
('{TENANT_ID}', 'entrevista', 'Entrevista', true, 1),
('{TENANT_ID}', 'citacion', 'Citación a padre/apoderado', true, 2),
('{TENANT_ID}', 'derivacion', 'Derivación a especialista', true, 3),
('{TENANT_ID}', 'seguimiento', 'Seguimiento', true, 4),
('{TENANT_ID}', 'medida', 'Medida Disciplinaria', true, 5),
('{TENANT_ID}', 'cierre', 'Cierre de Caso', true, 6);

-- =====================================================
-- 7. STAGE_SLA (5 registros)
-- =====================================================
INSERT INTO stage_sla (tenant_id, stage_key, days_to_due, is_active) VALUES
('{TENANT_ID}', '1. Recepción', 3, true),
('{TENANT_ID}', '2. Indagación', 10, true),
('{TENANT_ID}', '3. Análisis', 5, true),
('{TENANT_ID}', '4. Resolución', 5, true),
('{TENANT_ID}', '5. Seguimiento', 15, true);

-- =====================================================
-- 8. EVIDENCE (10 registros)
-- =====================================================
INSERT INTO evidence (tenant_id, case_id, file_name, file_path, file_type, file_size) 
SELECT 
  c.tenant_id,
  c.id,
  'evidencia_' || c.id::text || '.pdf',
  'evidencias/' || c.id::text || '/documento.pdf',
  'application/pdf',
  floor(random() * 1000000 + 10000)::bigint
FROM cases c
LIMIT 10;

-- =====================================================
-- 9. CASE_MESSAGES (15 registros)
-- =====================================================
INSERT INTO case_messages (tenant_id, case_id, body, sender_name, sender_role, is_urgent, created_at)
SELECT 
  c.tenant_id,
  c.id,
  (ARRAY['Caso requiere revisión', 'Entrevista programada', 'Padre contactedo', 'Medida aplicada'])[floor(random() * 4 + 1)],
  'Juan Pérez',
  'Inspector',
  random() > 0.7,
  c.created_at + (random() * 3)::int * INTERVAL '1 day'
FROM cases c
LIMIT 15;

-- =====================================================
-- 10. TENANT_PROFILES (3 registros)
-- =====================================================
-- Nota: Estos deben crearse desde auth.users primero
-- INSERT INTO tenant_profiles (id, tenant_id, email, full_name, role, is_active)
-- VALUES 
-- ('{USER_ID_1}', '{TENANT_ID}', 'admin@demo.cl', 'Administrador Demo', 'tenant_admin', true),
-- ('{USER_ID_2}', '{TENANT_ID}', 'inspector@demo.cl', 'Inspector Demo', 'user', true),
-- ('{USER_ID_3}', '{TENANT_ID}', 'orientacion@demo.cl', 'Orientación Demo', 'user', true);

-- =====================================================
-- 11. TENANT_AUDIT_LOG (5 registros)
-- =====================================================
INSERT INTO tenant_audit_log (tenant_id, action, table_name, record_id, old_values, new_values)
VALUES
('{TENANT_ID}', 'INSERT', 'students', gen_random_uuid(), NULL, '{"first_name": "Juan"}'),
('{TENANT_ID}', 'INSERT', 'cases', gen_random_uuid(), NULL, '{"status": "Reportado"}'),
('{TENANT_ID}', 'UPDATE', 'cases', gen_random_uuid(), '{"status": "Reportado"}', '{"status": "En Seguimiento"}'),
('{TENANT_ID}', 'INSERT', 'case_followups', gen_random_uuid(), NULL, '{"action_type": "Entrevista"}'),
('{TENANT_ID}', 'DELETE', 'students', gen_random_uuid(), '{"first_name": "Juan"}', NULL);

-- =====================================================
-- 12. TENANT_BRANDING (1 registro)
-- =====================================================
INSERT INTO tenant_branding (tenant_id, logo_url, primary_color, secondary_color, favicon_url)
VALUES ('{TENANT_ID}', 'https://example.com/logo.png', '#3B82F6', '#1E40AF', 'https://example.com/favicon.ico');

-- =====================================================
-- 13. TENANT_DOMAINS (1 registro)
-- =====================================================
INSERT INTO tenant_domains (tenant_id, domain, is_verified)
VALUES ('{TENANT_ID}', 'demo.plataforma.cl', true);

-- =====================================================
-- Verificar datos insertados
-- =====================================================
SELECT 
  'students' as table_name, count(*) as records FROM students
UNION ALL
SELECT 'cases', count(*) FROM cases
UNION ALL
SELECT 'case_followups', count(*) FROM case_followups
UNION ALL
SELECT 'conduct_types', count(*) FROM conduct_types
UNION ALL
SELECT 'conduct_catalog', count(*) FROM conduct_catalog
UNION ALL
SELECT 'action_types', count(*) FROM action_types
UNION ALL
SELECT 'stage_sla', count(*) FROM stage_sla
UNION ALL
SELECT 'evidence', count(*) FROM evidence
UNION ALL
SELECT 'case_messages', count(*) FROM case_messages
UNION ALL
SELECT 'tenant_audit_log', count(*) FROM tenant_audit_log;
