-- Restaurar vista eliminada por DROP ... CASCADE en stage_sla
-- Compatible con stage_sla sin tenant_id

DROP VIEW IF EXISTS public.v_control_unificado;

CREATE VIEW public.v_control_unificado AS
WITH student_info AS (
  SELECT
    c.id AS case_id,
    c.student_id,
    TRIM(BOTH FROM (COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, ''))) AS estudiante,
    s.rut AS estudiante_rut,
    s.course,
    s.level
  FROM public.cases c
  LEFT JOIN public.students s ON s.id = c.student_id
),
last_followup AS (
  SELECT DISTINCT ON (f.case_id)
    f.id AS followup_id,
    f.case_id,
    f.action_date,
    f.action_type,
    f.responsible,
    f.detail,
    f.process_stage,
    f.description,
    f.due_date,
    f.created_at
  FROM public.case_followups f
  ORDER BY f.case_id, f.action_date DESC NULLS LAST, f.created_at DESC
),
seguimiento AS (
  SELECT
    'seguimiento'::text AS tipo,
    lf.followup_id,
    c.id AS case_id,
    c.legacy_case_number,
    c.status AS estado_caso,
    c.conduct_type AS tipificacion_conducta,
    c.incident_date AS fecha_incidente,
    c.course_incident AS curso_incidente,
    COALESCE(lf.action_date, c.created_at::date) AS fecha,
    lf.action_type AS tipo_accion,
    'Completada'::text AS estado_etapa,
    lf.responsible AS responsable,
    lf.detail AS detalle,
    lf.process_stage AS etapa_debido_proceso,
    lf.description AS descripcion,
    lf.due_date AS fecha_plazo,
    CASE
      WHEN lf.due_date IS NULL THEN NULL
      ELSE public.business_days_between(CURRENT_DATE, lf.due_date)
    END AS dias_restantes,
    CASE
      WHEN lf.due_date IS NULL THEN 'Sin plazo'
      WHEN public.business_days_between(CURRENT_DATE, lf.due_date) < 0 THEN 'Vencido'
      WHEN public.business_days_between(CURRENT_DATE, lf.due_date) <= 1 THEN 'Urgente'
      WHEN public.business_days_between(CURRENT_DATE, lf.due_date) <= 3 THEN 'Proximo'
      ELSE 'OK'
    END AS alerta_urgencia,
    NULLIF((regexp_match(COALESCE(lf.process_stage, ''), '^([0-9]+)\.'))[1], '')::integer AS stage_num_from,
    ss.days_to_due,
    si.student_id,
    NULLIF(si.estudiante, '') AS estudiante,
    si.estudiante_rut,
    si.course,
    si.level
  FROM public.cases c
  LEFT JOIN last_followup lf ON lf.case_id = c.id
  LEFT JOIN public.stage_sla ss ON ss.stage_key = lf.process_stage
  LEFT JOIN student_info si ON si.case_id = c.id
),
indagacion AS (
  SELECT
    'indagacion'::text AS tipo,
    lf.followup_id,
    c.id AS case_id,
    c.legacy_case_number,
    c.status AS estado_caso,
    c.conduct_type AS tipificacion_conducta,
    c.incident_date AS fecha_incidente,
    c.course_incident AS curso_incidente,
    c.indagacion_start_date AS fecha,
    NULL::text AS tipo_accion,
    NULL::text AS estado_etapa,
    NULL::text AS responsable,
    NULL::text AS detalle,
    lf.process_stage AS etapa_debido_proceso,
    NULL::text AS descripcion,
    c.indagacion_due_date AS fecha_plazo,
    CASE
      WHEN c.indagacion_due_date IS NULL THEN NULL
      ELSE public.business_days_between(CURRENT_DATE, c.indagacion_due_date)
    END AS dias_restantes,
    CASE
      WHEN c.indagacion_due_date IS NULL THEN 'Sin plazo'
      WHEN public.business_days_between(CURRENT_DATE, c.indagacion_due_date) < 0 THEN 'Vencido'
      WHEN public.business_days_between(CURRENT_DATE, c.indagacion_due_date) <= 1 THEN 'Urgente'
      WHEN public.business_days_between(CURRENT_DATE, c.indagacion_due_date) <= 3 THEN 'Proximo'
      ELSE 'OK'
    END AS alerta_urgencia,
    NULL::integer AS stage_num_from,
    NULL::integer AS days_to_due,
    si.student_id,
    NULLIF(si.estudiante, '') AS estudiante,
    si.estudiante_rut,
    si.course,
    si.level
  FROM public.cases c
  LEFT JOIN last_followup lf ON lf.case_id = c.id
  LEFT JOIN student_info si ON si.case_id = c.id
  WHERE c.seguimiento_started_at IS NOT NULL
    AND c.indagacion_due_date IS NOT NULL
    AND COALESCE(c.status, '') <> 'Cerrado'
),
resumen AS (
  SELECT DISTINCT ON (c.id)
    'resumen'::text AS tipo,
    lf.followup_id,
    c.id AS case_id,
    NULL::text AS legacy_case_number,
    NULL::text AS estado_caso,
    NULL::text AS tipificacion_conducta,
    NULL::date AS fecha_incidente,
    NULL::text AS curso_incidente,
    NULL::date AS fecha,
    NULL::text AS tipo_accion,
    NULL::text AS estado_etapa,
    NULL::text AS responsable,
    NULL::text AS detalle,
    NULL::text AS etapa_debido_proceso,
    NULL::text AS descripcion,
    COALESCE(lf.due_date, c.indagacion_due_date) AS fecha_plazo,
    CASE
      WHEN COALESCE(lf.due_date, c.indagacion_due_date) IS NULL THEN NULL
      ELSE public.business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date))
    END AS dias_restantes,
    CASE
      WHEN COALESCE(lf.due_date, c.indagacion_due_date) IS NULL THEN 'Sin plazo'
      WHEN public.business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date)) < 0 THEN 'Vencido'
      WHEN public.business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date)) <= 1 THEN 'Urgente'
      WHEN public.business_days_between(CURRENT_DATE, COALESCE(lf.due_date, c.indagacion_due_date)) <= 3 THEN 'Proximo'
      ELSE 'OK'
    END AS alerta_urgencia,
    NULL::integer AS stage_num_from,
    NULL::integer AS days_to_due,
    si.student_id,
    NULLIF(si.estudiante, '') AS estudiante,
    si.estudiante_rut,
    si.course,
    si.level
  FROM public.cases c
  LEFT JOIN last_followup lf ON lf.case_id = c.id
  LEFT JOIN student_info si ON si.case_id = c.id
  WHERE COALESCE(c.status, '') <> 'Cerrado'
  ORDER BY c.id, COALESCE(lf.due_date, c.indagacion_due_date) ASC NULLS LAST
)
SELECT * FROM seguimiento
UNION ALL
SELECT * FROM indagacion
UNION ALL
SELECT * FROM resumen;

GRANT SELECT ON public.v_control_unificado TO anon, authenticated, service_role;
