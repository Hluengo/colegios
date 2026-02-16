-- =====================================================
-- 25_fix_stats_rpcs_signature_and_tenant.sql
-- Repara RPC de estadísticas (firma + tenant filter + grants)
-- =====================================================

DROP FUNCTION IF EXISTS public.stats_kpis(DATE, DATE);
DROP FUNCTION IF EXISTS public.stats_cumplimiento_plazos(DATE, DATE);
DROP FUNCTION IF EXISTS public.stats_reincidencia(DATE, DATE);
DROP FUNCTION IF EXISTS public.stats_mayor_carga(DATE, DATE);
DROP FUNCTION IF EXISTS public.stats_mayor_nivel(DATE, DATE);
DROP FUNCTION IF EXISTS public.stats_promedio_seguimientos_por_caso(DATE, DATE);
DROP FUNCTION IF EXISTS public.stats_tiempo_primer_seguimiento(DATE, DATE);
DROP FUNCTION IF EXISTS public.stats_casos_por_mes(DATE, DATE);
DROP FUNCTION IF EXISTS public.stats_casos_por_tipificacion(DATE, DATE);
DROP FUNCTION IF EXISTS public.stats_casos_por_curso(DATE, DATE);

CREATE OR REPLACE FUNCTION public.stats_kpis(desde DATE, hasta DATE)
RETURNS TABLE (
  casos_total BIGINT,
  abiertos BIGINT,
  cerrados BIGINT,
  promedio_cierre_dias NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS casos_total,
    COUNT(*) FILTER (WHERE c.status <> 'Cerrado')::BIGINT AS abiertos,
    COUNT(*) FILTER (WHERE c.status = 'Cerrado')::BIGINT AS cerrados,
    COALESCE(
      ROUND(AVG(EXTRACT(EPOCH FROM (c.closed_at - c.created_at)) / 86400)::NUMERIC, 1),
      0
    )::NUMERIC(10,1) AS promedio_cierre_dias
  FROM public.cases c
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.stats_cumplimiento_plazos(desde DATE, hasta DATE)
RETURNS TABLE (
  total_plazos BIGINT,
  fuera_plazo BIGINT,
  dentro_plazo BIGINT,
  cumplimiento_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH plazos AS (
    SELECT
      cf.id,
      cf.due_date,
      cf.action_date,
      CASE
        WHEN cf.due_date IS NOT NULL AND cf.action_date > cf.due_date THEN 1
        ELSE 0
      END AS fuera
    FROM public.case_followups cf
    INNER JOIN public.cases c ON c.id = cf.case_id
    WHERE c.tenant_id = public.current_tenant_id()
      AND c.incident_date BETWEEN desde AND hasta
      AND cf.due_date IS NOT NULL
  )
  SELECT
    COUNT(*)::BIGINT AS total_plazos,
    COALESCE(SUM(fuera), 0)::BIGINT AS fuera_plazo,
    (COUNT(*) - COALESCE(SUM(fuera), 0))::BIGINT AS dentro_plazo,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND(((COUNT(*) - COALESCE(SUM(fuera), 0))::NUMERIC / COUNT(*)) * 100, 1)
      ELSE 0
    END AS cumplimiento_pct
  FROM plazos;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.stats_reincidencia(desde DATE, hasta DATE)
RETURNS TABLE (
  estudiantes_reincidentes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM (
    SELECT c.student_id
    FROM public.cases c
    WHERE c.tenant_id = public.current_tenant_id()
      AND c.incident_date BETWEEN desde AND hasta
      AND c.student_id IS NOT NULL
    GROUP BY c.student_id
    HAVING COUNT(*) >= 2
  ) sub;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.stats_mayor_carga(desde DATE, hasta DATE)
RETURNS TABLE (
  responsable TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(cf.responsible, ''), 'Sin responsable') AS responsable,
    COUNT(*)::BIGINT AS total
  FROM public.case_followups cf
  INNER JOIN public.cases c ON c.id = cf.case_id
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta
  GROUP BY cf.responsible
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.stats_mayor_nivel(desde DATE, hasta DATE)
RETURNS TABLE (
  level TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(c.conduct_category, ''), 'Desconocido') AS level,
    COUNT(*)::BIGINT AS total
  FROM public.cases c
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta
  GROUP BY c.conduct_category
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.stats_promedio_seguimientos_por_caso(desde DATE, hasta DATE)
RETURNS TABLE (
  promedio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(ROUND(AVG(cnt)::NUMERIC, 1), 0)::NUMERIC(10,1)
  FROM (
    SELECT COUNT(*) AS cnt
    FROM public.case_followups cf
    INNER JOIN public.cases c ON c.id = cf.case_id
    WHERE c.tenant_id = public.current_tenant_id()
      AND c.incident_date BETWEEN desde AND hasta
    GROUP BY c.id
  ) sub;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.stats_tiempo_primer_seguimiento(desde DATE, hasta DATE)
RETURNS TABLE (
  promedio_dias NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(
    ROUND(AVG(EXTRACT(EPOCH FROM (primer.action_date::TIMESTAMPTZ - c.created_at)) / 86400)::NUMERIC, 1),
    0
  )::NUMERIC(10,1)
  FROM public.cases c
  INNER JOIN LATERAL (
    SELECT cf.action_date
    FROM public.case_followups cf
    WHERE cf.case_id = c.id
    ORDER BY cf.action_date ASC
    LIMIT 1
  ) primer ON TRUE
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.stats_casos_por_mes(desde DATE, hasta DATE)
RETURNS TABLE (
  mes TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(c.incident_date, 'YYYY-MM') AS mes,
    COUNT(*)::BIGINT AS total
  FROM public.cases c
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta
  GROUP BY TO_CHAR(c.incident_date, 'YYYY-MM')
  ORDER BY mes;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.stats_casos_por_tipificacion(desde DATE, hasta DATE)
RETURNS TABLE (
  tipo TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(c.conduct_type, ''), 'Sin tipificación') AS tipo,
    COUNT(*)::BIGINT AS total
  FROM public.cases c
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta
  GROUP BY c.conduct_type
  ORDER BY COUNT(*) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.stats_casos_por_curso(desde DATE, hasta DATE)
RETURNS TABLE (
  curso TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(c.course_incident, ''), 'Sin curso') AS curso,
    COUNT(*)::BIGINT AS total
  FROM public.cases c
  WHERE c.tenant_id = public.current_tenant_id()
    AND c.incident_date BETWEEN desde AND hasta
  GROUP BY c.course_incident
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.stats_kpis(DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stats_cumplimiento_plazos(DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stats_reincidencia(DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stats_mayor_carga(DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stats_mayor_nivel(DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stats_promedio_seguimientos_por_caso(DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stats_tiempo_primer_seguimiento(DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stats_casos_por_mes(DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stats_casos_por_tipificacion(DATE, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stats_casos_por_curso(DATE, DATE) TO authenticated, service_role;

SELECT 'OK: stats RPC repaired (signature + tenant filter)' AS status;
