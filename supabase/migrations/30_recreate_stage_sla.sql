DROP TABLE IF EXISTS public.stage_sla CASCADE;

CREATE TABLE public.stage_sla (
  stage_key text NOT NULL,
  days_to_due integer NULL,
  CONSTRAINT stage_sla_pkey PRIMARY KEY (stage_key),
  CONSTRAINT uq_stage_sla_stage_key UNIQUE (stage_key),
  CONSTRAINT ck_stage_sla_days_to_due CHECK ((days_to_due >= 0))
) TABLESPACE pg_default;
