-- ============================================
-- 13_action_types.sql
-- Catálogo dinámico de tipos de acciones
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Crear tabla action_types
CREATE TABLE IF NOT EXISTS public.action_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poblar con valores actuales
INSERT INTO action_types (name, category, sort_order) VALUES
  ('Entrevista', 'Gestion', 1),
  ('Notificación', 'Comunicacion', 2),
  ('Recopilación', 'Investigacion', 3),
  ('Medida', 'Accion', 4),
  ('Indagacion', 'Investigacion', 5),
  ('Resolucion', 'Legal', 6),
  ('Apelacion', 'Legal', 7),
  ('Monitoreo', 'Seguimiento', 8)
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS
ALTER TABLE action_types ENABLE ROW LEVEL SECURITY;

-- Verificar si ya existe la política antes de crear
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow read action_types' AND tablename = 'action_types'
  ) THEN
    CREATE POLICY "Allow read action_types" ON action_types
      FOR SELECT USING (active = true);
  END IF;
END $$;

-- Comentario
COMMENT ON TABLE action_types IS 'Catálogo de tipos de acciones para seguimientos';
COMMENT ON COLUMN action_types.name IS 'Nombre del tipo de acción';
COMMENT ON COLUMN action_types.category IS 'Categoría (Gestion, Comunicacion, Investigacion, etc.)';
COMMENT ON COLUMN action_types.sort_order IS 'Orden de visualización';
COMMENT ON COLUMN action_types.active IS 'Si está activo para nuevos registros';
