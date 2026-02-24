-- =====================================================
-- Datos de Prueba para Supabase
-- Sistema de Gestión de Convivencia Escolar
-- =====================================================

-- Obtener el tenant_id del tenant demo
-- Ejecutar primero para obtener el ID
-- Ensure demo tenant exists (idempotent)
INSERT INTO tenants (slug, legal_name, display_name, status, subscription_plan, subscription_status, primary_color, secondary_color)
VALUES ('demo', 'Colegio Demo', 'Colegio Demo', 'active', 'professional', 'active', '#3B82F6', '#1E40AF')
ON CONFLICT (slug) DO UPDATE
  SET legal_name = EXCLUDED.legal_name,
      display_name = EXCLUDED.display_name,
      status = EXCLUDED.status,
      subscription_plan = EXCLUDED.subscription_plan,
      subscription_status = COALESCE(tenants.subscription_status, EXCLUDED.subscription_status),
      primary_color = EXCLUDED.primary_color,
      secondary_color = EXCLUDED.secondary_color;

-- All subsequent inserts use (SELECT id FROM tenants WHERE slug = 'demo') to guarantee tenant_id is present

-- =====================================================
-- 1. STUDENTS (20 registros)
-- =====================================================
INSERT INTO students (tenant_id, first_name, last_name, rut, course, level) VALUES
((SELECT id FROM tenants WHERE slug = 'demo'), 'Juan', 'Pérez García', '12345678-5', '1° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'María', 'López Hernández', '23456789-0', '2° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Pedro', 'González Müller', '34567890-1', '3° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Ana', 'Martínez Sánchez', '45678901-2', '4° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Carlos', 'Rodríguez Díaz', '56789012-3', '5° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Sofía', 'Fernández Torres', '67890123-4', '6° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Diego', 'Ramírez Flores', '78901234-5', '7° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Isabella', 'Torres Rivera', '89012345-6', '8° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Miguel', 'Vargas Sánchez', '90123456-7', '1° Medio', 'Medio'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Valentina', 'Mendoza Castro', '01234567-8', '2° Medio', 'Medio'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Alejandro', 'Silva Ortega', '11223344-5', '3° Medio', 'Medio'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Camila', 'Aguilar Pérez', '22334455-6', '4° Medio', 'Medio'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Sebastián', 'Navarro Rojas', '33445566-7', '1° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Martina', 'Cortés Jiménez', '44556677-8', '2° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Gabriel', 'Becerra Luna', '55667788-9', '3° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Emilia', 'Reyes Gutiérrez', '66778899-0', '4° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Benjamín', 'Carrasco Miranda', '77889900-1', '5° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Catalina', 'Escobar Navarro', '88990011-2', '6° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Daniel', 'Arias Castillo', '99001122-3', '7° Básico', 'Básico'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Antonella', 'Vega Fuentes', '10111223-4', '8° Básico', 'Básico');

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
((SELECT id FROM tenants WHERE slug = 'demo'), 'Agresión Física', 'Conducta Grave', true, 1),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Agresión Verbal', 'Conducta Grave', true, 2),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Bullying/Ciberbullying', 'Conducta Gravísima', true, 3),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Robo', 'Conducta Grave', true, 4),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Vandalismo', 'Conducta Grave', true, 5),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Consumo de Sustancias', 'Conducta Gravísima', true, 6),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Falta de Respeto', 'Conducta Leve', true, 7),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Otro', 'Conducta Leve', true, 99);

-- =====================================================
-- 5. CONDUCT_CATALOG (16 registros)
-- =====================================================
INSERT INTO conduct_catalog (tenant_id, conduct_type, conduct_category, is_active, sort_order) VALUES
((SELECT id FROM tenants WHERE slug = 'demo'), 'Agresión Física', 'Leve', true, 1),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Agresión Física', 'Grave', true, 2),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Agresión Física', 'Muy Grave', true, 3),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Agresión Verbal', 'Leve', true, 4),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Agresión Verbal', 'Grave', true, 5),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Bullying/Ciberbullying', 'Grave', true, 6),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Bullying/Ciberbullying', 'Gravísima', true, 7),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Robo', 'Grave', true, 8),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Robo', 'Gravísima', true, 9),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Vandalismo', 'Leve', true, 10),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Vandalismo', 'Grave', true, 11),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Consumo de Sustancias', 'Gravísima', true, 12),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Falta de Respeto', 'Leve', true, 13),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Falta de Respeto', 'Grave', true, 14),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Otro', 'Leve', true, 15),
((SELECT id FROM tenants WHERE slug = 'demo'), 'Otro', 'Grave', true, 16);

-- =====================================================
-- 6. ACTION_TYPES (6 registros)
-- =====================================================
INSERT INTO action_types (tenant_id, key, label, is_active, sort_order) VALUES
((SELECT id FROM tenants WHERE slug = 'demo'), 'entrevista', 'Entrevista', true, 1),
((SELECT id FROM tenants WHERE slug = 'demo'), 'citacion', 'Citación a padre/apoderado', true, 2),
((SELECT id FROM tenants WHERE slug = 'demo'), 'derivacion', 'Derivación a especialista', true, 3),
((SELECT id FROM tenants WHERE slug = 'demo'), 'seguimiento', 'Seguimiento', true, 4),
((SELECT id FROM tenants WHERE slug = 'demo'), 'medida', 'Medida Disciplinaria', true, 5),
((SELECT id FROM tenants WHERE slug = 'demo'), 'cierre', 'Cierre de Caso', true, 6);

-- =====================================================
-- 7. STAGE_SLA (5 registros)
-- =====================================================
INSERT INTO stage_sla (tenant_id, stage_key, days_to_due, is_active) VALUES
((SELECT id FROM tenants WHERE slug = 'demo'), '1. Recepción', 3, true),
((SELECT id FROM tenants WHERE slug = 'demo'), '2. Indagación', 10, true),
((SELECT id FROM tenants WHERE slug = 'demo'), '3. Análisis', 5, true),
((SELECT id FROM tenants WHERE slug = 'demo'), '4. Resolución', 5, true),
((SELECT id FROM tenants WHERE slug = 'demo'), '5. Seguimiento', 15, true);

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
((SELECT id FROM tenants WHERE slug = 'demo'), 'INSERT', 'students', gen_random_uuid(), NULL, '{"first_name": "Juan"}'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'INSERT', 'cases', gen_random_uuid(), NULL, '{"status": "Reportado"}'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'UPDATE', 'cases', gen_random_uuid(), '{"status": "Reportado"}', '{"status": "En Seguimiento"}'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'INSERT', 'case_followups', gen_random_uuid(), NULL, '{"action_type": "Entrevista"}'),
((SELECT id FROM tenants WHERE slug = 'demo'), 'DELETE', 'students', gen_random_uuid(), '{"first_name": "Juan"}', NULL);

-- =====================================================
-- 12. TENANT_BRANDING (1 registro)
-- =====================================================
INSERT INTO tenant_branding (tenant_id, logo_url, primary_color, secondary_color, favicon_url)
VALUES ((SELECT id FROM tenants WHERE slug = 'demo'), 'https://example.com/logo.png', '#3B82F6', '#1E40AF', 'https://example.com/favicon.ico');

-- =====================================================
-- 13. TENANT_DOMAINS (1 registro)
-- =====================================================
INSERT INTO tenant_domains (tenant_id, domain, is_verified)
VALUES ((SELECT id FROM tenants WHERE slug = 'demo'), 'demo.plataforma.cl', true);

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
