-- =====================================================
-- 24_case_messages_and_attachments.sql
-- Crea/normaliza mensajes de caso y adjuntos (multi-tenant)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- case_messages (idempotente + columnas faltantes)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.case_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  process_stage TEXT,
  body TEXT NOT NULL,
  sender_name TEXT,
  sender_role TEXT,
  parent_id UUID,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.case_messages
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS process_stage TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_role TEXT,
  ADD COLUMN IF NOT EXISTS parent_id UUID,
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'case_messages_parent_id_fkey'
  ) THEN
    ALTER TABLE public.case_messages
      ADD CONSTRAINT case_messages_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES public.case_messages(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill tenant_id desde el caso si faltaba
UPDATE public.case_messages m
SET tenant_id = c.tenant_id
FROM public.cases c
WHERE m.case_id = c.id
  AND m.tenant_id IS NULL;

-- -----------------------------------------------------
-- case_message_attachments
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.case_message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.case_messages(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'evidencias',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.case_message_attachments
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES public.case_messages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT NOT NULL DEFAULT 'evidencias',
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill tenant_id desde el mensaje si faltaba
UPDATE public.case_message_attachments a
SET tenant_id = m.tenant_id
FROM public.case_messages m
WHERE a.message_id = m.id
  AND a.tenant_id IS NULL;

-- -----------------------------------------------------
-- Funciones para auto-resolver tenant_id en inserts
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_case_message_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tenant_id IS NULL AND NEW.case_id IS NOT NULL THEN
    SELECT c.tenant_id INTO NEW.tenant_id
    FROM public.cases c
    WHERE c.id = NEW.case_id
    LIMIT 1;
  END IF;

  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_case_message_attachment_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tenant_id IS NULL AND NEW.message_id IS NOT NULL THEN
    SELECT m.tenant_id INTO NEW.tenant_id
    FROM public.case_messages m
    WHERE m.id = NEW.message_id
    LIMIT 1;
  END IF;

  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_case_messages_set_tenant ON public.case_messages;
CREATE TRIGGER trg_case_messages_set_tenant
  BEFORE INSERT ON public.case_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_message_tenant_id();

DROP TRIGGER IF EXISTS trg_case_message_attachments_set_tenant ON public.case_message_attachments;
CREATE TRIGGER trg_case_message_attachments_set_tenant
  BEFORE INSERT ON public.case_message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_message_attachment_tenant_id();

-- updated_at triggers (si existe helper global)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_case_messages_updated_at ON public.case_messages;
    CREATE TRIGGER trigger_case_messages_updated_at
      BEFORE UPDATE ON public.case_messages
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS trigger_case_message_attachments_updated_at ON public.case_message_attachments;
    CREATE TRIGGER trigger_case_message_attachments_updated_at
      BEFORE UPDATE ON public.case_message_attachments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- -----------------------------------------------------
-- Índices
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_case_messages_case
  ON public.case_messages (tenant_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_case_messages_parent
  ON public.case_messages (case_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_case_message_attachments_message
  ON public.case_message_attachments (tenant_id, message_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_case_message_attachments_storage_path
  ON public.case_message_attachments (storage_path);

-- -----------------------------------------------------
-- RLS + políticas
-- -----------------------------------------------------
ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_messages_select ON public.case_messages;
DROP POLICY IF EXISTS case_messages_insert ON public.case_messages;
DROP POLICY IF EXISTS case_messages_update ON public.case_messages;
DROP POLICY IF EXISTS case_messages_delete ON public.case_messages;

CREATE POLICY case_messages_select ON public.case_messages
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY case_messages_insert ON public.case_messages
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY case_messages_update ON public.case_messages
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY case_messages_delete ON public.case_messages
  FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

DROP POLICY IF EXISTS case_message_attachments_select ON public.case_message_attachments;
DROP POLICY IF EXISTS case_message_attachments_insert ON public.case_message_attachments;
DROP POLICY IF EXISTS case_message_attachments_update ON public.case_message_attachments;
DROP POLICY IF EXISTS case_message_attachments_delete ON public.case_message_attachments;

CREATE POLICY case_message_attachments_select ON public.case_message_attachments
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY case_message_attachments_insert ON public.case_message_attachments
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY case_message_attachments_update ON public.case_message_attachments
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY case_message_attachments_delete ON public.case_message_attachments
  FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_tenant_admin() = TRUE);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_messages TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_message_attachments TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

SELECT 'OK: case_messages + case_message_attachments ready' AS status;
