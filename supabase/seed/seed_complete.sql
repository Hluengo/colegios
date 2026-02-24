-- =====================================================
-- DATOS DE PRUEBA - Ejemplo con valores reales
-- Reemplaza {TENANT_ID} con el ID de tu tenant antes de ejecutar
-- =====================================================

-- Primero obtiene el tenant_id
DO $$ 
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Obtener o crear tenant demo
  INSERT INTO tenants (slug, legal_name, display_name, status, subscription_plan, primary_color, secondary_color)
  VALUES ('demo', 'Colegio Demo', 'Colegio Demo', 'active', 'professional', '#3B82F6', '#1E40AF')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_tenant_id;
  
  RAISE NOTICE 'USE ESTE TENANT_ID: %', v_tenant_id;
  
  -- =====================================================
  -- STUDENTS (20 registros)
  -- =====================================================
  INSERT INTO students (tenant_id, first_name, last_name, rut, course, level) VALUES
  (v_tenant_id, 'Juan', 'Pérez García', '12345678-5', '1° Básico', 'Básico'),
  (v_tenant_id, 'María', 'López Hernández', '23456789-0', '2° Básico', 'Básico'),
  (v_tenant_id, 'Pedro', 'González Müller', '34567890-1', '3° Básico', 'Básico'),
  (v_tenant_id, 'Ana', 'Martínez Sánchez', '45678901-2', '4° Básico', 'Básico'),
  (v_tenant_id, 'Carlos', 'Rodríguez Díaz', '56789012-3', '5° Básico', 'Básico'),
  (v_tenant_id, 'Sofía', 'Fernández Torres', '67890123-4', '6° Básico', 'Básico'),
  (v_tenant_id, 'Diego', 'Vargas Sánchez', '78901234-5', '7° Básico', 'Básico'),
  (v_tenant_id, 'Isabella', 'Torres Rivera', '89012345-6', '8° Básico', 'Básico'),
  (v_tenant_id, 'Miguel', 'Mendoza Castro', '01234567-8', '1° Medio', 'Medio'),
  (v_tenant_id, 'Valentina', 'Silva Ortega', '11223344-5', '2° Medio', 'Medio'),
  (v_tenant_id, 'Alejandro', 'Navarro Rojas', '22334455-6', '3° Medio', 'Medio'),
  (v_tenant_id, 'Camila', 'Aguilar Pérez', '33445566-7', '4° Medio', 'Medio'),
  (v_tenant_id, 'Sebastián', 'Cortés Jiménez', '44556677-8', '1° Básico', 'Básico'),
  (v_tenant_id, 'Martina', 'Becerra Luna', '55667788-9', '2° Básico', 'Básico'),
  (v_tenant_id, 'Gabriel', 'Reyes Gutiérrez', '66778899-0', '3° Básico', 'Básico'),
  (v_tenant_id, 'Emilia', 'Carrasco Miranda', '77889900-1', '4° Básico', 'Básico'),
  (v_tenant_id, 'Benjamín', 'Escobar Navarro', '88990011-2', '5° Básico', 'Básico'),
  (v_tenant_id, 'Catalina', 'Arias Castillo', '99001122-3', '6° Básico', 'Básico'),
  (v_tenant_id, 'Daniel', 'Vega Fuentes', '10111223-4', '7° Básico', 'Básico'),
  (v_tenant_id, 'Antonella', 'Navarro Torres', '21222334-5', '8° Básico', 'Básico')
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- CONDUCT_TYPES
  -- =====================================================
  INSERT INTO conduct_types (tenant_id, type_name, type_category, is_active, sort_order) VALUES
  (v_tenant_id, 'Agresión Física', 'Conducta Grave', true, 1),
  (v_tenant_id, 'Agresión Verbal', 'Conducta Grave', true, 2),
  (v_tenant_id, 'Bullying/Ciberbullying', 'Conducta Gravísima', true, 3),
  (v_tenant_id, 'Robo', 'Conducta Grave', true, 4),
  (v_tenant_id, 'Vandalismo', 'Conducta Grave', true, 5),
  (v_tenant_id, 'Consumo de Sustancias', 'Conducta Gravísima', true, 6),
  (v_tenant_id, 'Falta de Respeto', 'Conducta Leve', true, 7),
  (v_tenant_id, 'Otro', 'Conducta Leve', true, 99)
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- ACTION_TYPES
  -- =====================================================
  INSERT INTO action_types (tenant_id, key, label, is_active, sort_order) VALUES
  (v_tenant_id, 'entrevista', 'Entrevista', true, 1),
  (v_tenant_id, 'citacion', 'Citación a padre/apoderado', true, 2),
  (v_tenant_id, 'derivacion', 'Derivación a especialista', true, 3),
  (v_tenant_id, 'seguimiento', 'Seguimiento', true, 4),
  (v_tenant_id, 'medida', 'Medida Disciplinaria', true, 5),
  (v_tenant_id, 'cierre', 'Cierre de Caso', true, 6)
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- STAGE_SLA
  -- =====================================================
  INSERT INTO stage_sla (tenant_id, stage_key, days_to_due, is_active) VALUES
  (v_tenant_id, '1. Recepción', 3, true),
  (v_tenant_id, '2. Indagación', 10, true),
  (v_tenant_id, '3. Análisis', 5, true),
  (v_tenant_id, '4. Resolución', 5, true),
  (v_tenant_id, '5. Seguimiento', 15, true)
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- CASES (10 registros con estudiantes)
  -- =====================================================
  INSERT INTO cases (tenant_id, student_id, incident_date, incident_time, course_incident, status, conduct_type, conduct_category, short_description, actions_taken, responsible, responsible_role, guardian_notified, indagacion_start_date, indagacion_due_date, seguimiento_started_at, legacy_case_number, student_name) 
  SELECT 
    v_tenant_id,
    id,
    CURRENT_DATE - (random() * 30 + 1)::int,
    '10:30',
    course,
    (ARRAY['Reportado', 'En Seguimiento', 'Cerrado'])[floor(random() * 3 + 1)],
    (ARRAY['Agresión Física', 'Agresión Verbal', 'Bullying', 'Robo', 'Falta de Respeto'])[floor(random() * 5 + 1)],
    (ARRAY['Leve', 'Grave', 'Muy Grave'])[floor(random() * 3 + 1)],
    'Incidente entre estudiantes en recreo',
    'Se realizó entrevista con involucrados',
    'Juan Pérez',
    'Inspector',
    true,
    CURRENT_DATE - (random() * 10 + 1)::int,
    CURRENT_DATE + (random() * 10 + 1)::int,
    CURRENT_DATE - (random() * 5 + 1)::int,
    'CASE-' || floor(random() * 9000 + 1000)::text,
    first_name || ' ' || last_name
  FROM students
  LIMIT 10;

  -- =====================================================
  -- CASE_FOLLOWUPS (15 registros)
  -- =====================================================
  INSERT INTO case_followups (tenant_id, case_id, action_date, action_type, process_stage, detail, responsible, observations, description, due_date)
  SELECT 
    v_tenant_id,
    id,
    created_at + (random() * 7 + 1)::int * INTERVAL '1 day',
    (ARRAY['Entrevista', 'Citación', 'Derivación', 'Seguimiento'])[floor(random() * 4 + 1)],
    '1. Recepción',
    'Se realizó entrevista con el estudiante',
    'Juan Pérez',
    'Estudiante colaborador',
    'Entrevista realizada con éxito',
    created_at + 10
  FROM cases
  LIMIT 15;

  -- =====================================================
  -- EVIDENCE (5 registros)
  -- =====================================================
  INSERT INTO evidence (tenant_id, case_id, file_name, file_path, file_type, file_size) 
  SELECT 
    v_tenant_id,
    id,
    'evidencia_' || id::text || '.pdf',
    'evidencias/' || id::text || '/documento.pdf',
    'application/pdf',
    (random() * 1000000 + 10000)::bigint
  FROM cases
  LIMIT 5;

  -- =====================================================
  -- CASE_MESSAGES (8 registros)
  -- =====================================================
  INSERT INTO case_messages (tenant_id, case_id, body, sender_name, sender_role, is_urgent)
  SELECT 
    v_tenant_id,
    id,
    (ARRAY['Caso requiere revisión', 'Entrevista programada', 'Padre contactado', 'Medida aplicada'])[floor(random() * 4 + 1)],
    'Juan Pérez',
    'Inspector',
    random() > 0.7
  FROM cases
  LIMIT 8;

  -- =====================================================
  -- TENANT_BRANDING
  -- =====================================================
  INSERT INTO tenant_branding (tenant_id, logo_url, primary_color, secondary_color)
  VALUES (v_tenant_id, 'https://picsum.photos/200', '#3B82F6', '#1E40AF')
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- TENANT_DOMAINS
  -- =====================================================
  INSERT INTO tenant_domains (tenant_id, domain, is_verified)
  VALUES (v_tenant_id, 'demo.plataforma.cl', true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Datos de prueba insertados correctamente';
END $$;

-- Verificar
SELECT 
  'students' as tabla, count(*) as registros FROM students
UNION ALL
SELECT 'cases', count(*) FROM cases
UNION ALL
SELECT 'case_followups', count(*) FROM case_followups
UNION ALL
SELECT 'conduct_types', count(*) FROM conduct_types
UNION ALL
SELECT 'action_types', count(*) FROM action_types
UNION ALL
SELECT 'stage_sla', count(*) FROM stage_sla
UNION ALL
SELECT 'evidence', count(*) FROM evidence
UNION ALL
SELECT 'case_messages', count(*) FROM case_messages;
