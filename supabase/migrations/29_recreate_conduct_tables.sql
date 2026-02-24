CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS public.conduct_catalog CASCADE;
DROP TABLE IF EXISTS public.conduct_types CASCADE;

CREATE TABLE public.conduct_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conduct_type text NOT NULL,
  conduct_category text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conduct_catalog_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS ux_conduct_catalog_type_category
ON public.conduct_catalog USING btree (conduct_type, conduct_category)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_conduct_catalog_type_active
ON public.conduct_catalog USING btree (conduct_type, active)
TABLESPACE pg_default;

CREATE TABLE public.conduct_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  label text NOT NULL,
  color text NOT NULL,
  sort_order integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT conduct_types_pkey PRIMARY KEY (id),
  CONSTRAINT conduct_types_key_key UNIQUE (key)
) TABLESPACE pg_default;
