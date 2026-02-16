-- =====================================================
-- PARTE 4: SEED DE CATALOGOS (COHERENTE)
-- =====================================================

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

INSERT INTO conduct_types (tenant_id, type_name, type_category, sort_order, is_active)
SELECT t.id, c.type_name, c.type_category, c.sort_order, TRUE
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
  ('Otro', 'Leve', 99)
) AS c(type_name, type_category, sort_order)
WHERE t.slug = 'demo'
ON CONFLICT (tenant_id, type_name) DO UPDATE
SET type_category = EXCLUDED.type_category,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO conduct_catalog (tenant_id, conduct_type, conduct_category, sort_order, is_active)
SELECT t.id, c.conduct_type, c.conduct_category, c.sort_order, TRUE
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
) AS c(conduct_type, conduct_category, sort_order)
WHERE t.slug = 'demo'
ON CONFLICT (tenant_id, conduct_type, conduct_category) DO UPDATE
SET sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO action_types (tenant_id, key, label, description, is_active, sort_order)
SELECT t.id, a.key, a.label, a.description, TRUE, a.sort_order
FROM tenants t
CROSS JOIN (VALUES
  ('seguimiento', 'Seguimiento', 'Seguimiento general', 1),
  ('entrevista', 'Entrevista', 'Entrevista con involucrados', 2),
  ('citacion', 'Citación', 'Citación formal', 3),
  ('derivacion', 'Derivación', 'Derivación a especialista', 4),
  ('medida_disciplinaria', 'Medida Disciplinaria', 'Aplicación de medida', 5),
  ('cierre', 'Cierre', 'Cierre del caso', 6)
) AS a(key, label, description, sort_order)
WHERE t.slug = 'demo'
ON CONFLICT (tenant_id, key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

INSERT INTO stage_sla (stage_key, tenant_id, days_to_due, is_active)
SELECT s.stage_key, t.id, s.days_to_due, TRUE
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

SELECT '✅ Parte 4 completada: seed aplicado' AS status;
