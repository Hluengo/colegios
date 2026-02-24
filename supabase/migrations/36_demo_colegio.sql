-- =====================================================
-- 36_demo_colegio.sql
-- Agrega campo descripción a tenants y crea colegio demo
-- =====================================================

-- Agregar campo descripción si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'descripcion'
  ) THEN
    ALTER TABLE tenants ADD COLUMN descripcion TEXT;
  END IF;
END $$;

-- Crear índice para búsquedas por slug
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Insertar colegio demo si no existe
INSERT INTO tenants (
  slug,
  name,
  address,
  phone,
  email,
  logo_url,
  descripcion,
  subscription_status,
  subscription_plan,
  is_active,
  primary_color,
  secondary_color
) VALUES (
  'demo',
  'Colegio Demo San Patricio',
  'Av. Educación 1234, Santiago, Chile',
  '+56 2 2345 6789',
  'hluengo.ro@gmail.com',
  '/branding/generic_logo.png',
  'Institución educacional líder en formación integral de estudiantes. Más de 30 años de experiencia brindando educación de calidad con enfoque en valores, innovación pedagógica y desarrollo personal. Nuestro sistema de gestión de casos nos permite atender de manera efectiva situaciones de convivencia escolar.',
  'active',
  'professional',
  TRUE,
  '#2563eb',
  '#1e40af'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  logo_url = EXCLUDED.logo_url,
  descripcion = EXCLUDED.descripcion,
  subscription_status = EXCLUDED.subscription_status,
  subscription_plan = EXCLUDED.subscription_plan,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- RLS Policies para lectura pública de colegios
-- =====================================================

-- Asegurar que RLS esté habilitado
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública de colegios activos (para landing page)
DROP POLICY IF EXISTS "Public read active tenants" ON tenants;
CREATE POLICY "Public read active tenants" ON tenants
  FOR SELECT
  USING (is_active = TRUE);

-- Función para obtener colegio demo (para landing page)
CREATE OR REPLACE FUNCTION get_demo_colegio()
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  descripcion TEXT,
  primary_color TEXT,
  secondary_color TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.slug,
    t.name,
    t.address,
    t.phone,
    t.email,
    t.logo_url,
    t.descripcion,
    t.primary_color,
    t.secondary_color
  FROM tenants t
  WHERE t.slug = 'demo' AND t.is_active = TRUE;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION get_demo_colegio() IS 
'Función pública para obtener información del colegio demo para la landing page';
