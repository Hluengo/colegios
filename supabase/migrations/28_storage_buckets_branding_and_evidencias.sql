-- Crea/normaliza buckets usados por el frontend:
-- - branding: logos/favicon de tenant (público)
-- - evidencias: archivos adjuntos del caso (público según implementación actual)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  5242880,
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'evidencias',
  'evidencias',
  true,
  10485760
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Políticas para bucket branding
DROP POLICY IF EXISTS "storage_branding_select_public" ON storage.objects;
CREATE POLICY "storage_branding_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "storage_branding_insert_auth" ON storage.objects;
CREATE POLICY "storage_branding_insert_auth"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding');

DROP POLICY IF EXISTS "storage_branding_update_auth" ON storage.objects;
CREATE POLICY "storage_branding_update_auth"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'branding')
WITH CHECK (bucket_id = 'branding');

DROP POLICY IF EXISTS "storage_branding_delete_auth" ON storage.objects;
CREATE POLICY "storage_branding_delete_auth"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'branding');

-- Políticas para bucket evidencias
DROP POLICY IF EXISTS "storage_evidencias_select_public" ON storage.objects;
CREATE POLICY "storage_evidencias_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'evidencias');

DROP POLICY IF EXISTS "storage_evidencias_insert_auth" ON storage.objects;
CREATE POLICY "storage_evidencias_insert_auth"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidencias');

DROP POLICY IF EXISTS "storage_evidencias_update_auth" ON storage.objects;
CREATE POLICY "storage_evidencias_update_auth"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'evidencias')
WITH CHECK (bucket_id = 'evidencias');

DROP POLICY IF EXISTS "storage_evidencias_delete_auth" ON storage.objects;
CREATE POLICY "storage_evidencias_delete_auth"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'evidencias');
