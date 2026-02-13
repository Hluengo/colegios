-- =====================================================
-- 15_refresh_stats_rpcs_no_stage_status.sql
-- Re-crea RPCs de estadísticas sin depender de case_followups.stage_status
-- =====================================================

-- Nota: CREATE OR REPLACE no permite cambiar RETURNS TABLE (OUT params)
-- si la función existente tiene otra forma de retorno.
-- Por eso primero eliminamos las firmas actuales por parámetros.
DROP FUNCTION IF EXISTS stats_kpis(DATE, DATE);
DROP FUNCTION IF EXISTS stats_cumplimiento_plazos(DATE, DATE);
DROP FUNCTION IF EXISTS stats_reincidencia(DATE, DATE);
DROP FUNCTION IF EXISTS stats_mayor_carga(DATE, DATE);
DROP FUNCTION IF EXISTS stats_mayor_nivel(DATE, DATE);
DROP FUNCTION IF EXISTS stats_promedio_seguimientos_por_caso(DATE, DATE);
DROP FUNCTION IF EXISTS stats_tiempo_primer_seguimiento(DATE, DATE);
DROP FUNCTION IF EXISTS stats_casos_por_mes(DATE, DATE);
DROP FUNCTION IF EXISTS stats_casos_por_tipificacion(DATE, DATE);
DROP FUNCTION IF EXISTS stats_casos_por_curso(DATE, DATE);

CREATE OR REPLACE FUNCTION stats_kpis(desde DATE, hasta DATE)
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
    COUNT(*) FILTER (WHERE status != 'Cerrado')::BIGINT AS abiertos,
    COUNT(*) FILTER (WHERE status = 'Cerrado')::BIGINT AS cerrados,
    COALESCE(
      ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 86400)::NUMERIC, 1),
      0
    )::NUMERIC(10,1) AS promedio_cierre_dias
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION stats_cumplimiento_plazos(desde DATE, hasta DATE)
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
    FROM case_followups cf
    INNER JOIN cases c ON c.id = cf.case_id
    WHERE c.incident_date BETWEEN desde AND hasta
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

CREATE OR REPLACE FUNCTION stats_reincidencia(desde DATE, hasta DATE)
RETURNS TABLE (
  estudiantes_reincidentes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM (
    SELECT student_id
    FROM cases
    WHERE incident_date BETWEEN desde AND hasta
      AND student_id IS NOT NULL
    GROUP BY student_id
    HAVING COUNT(*) >= 2
  ) sub;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION stats_mayor_carga(desde DATE, hasta DATE)
RETURNS TABLE (
  responsable TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(cf.responsible, 'Sin responsable') AS responsable,
    COUNT(*)::BIGINT AS total
  FROM case_followups cf
  INNER JOIN cases c ON c.id = cf.case_id
  WHERE c.incident_date BETWEEN desde AND hasta
  GROUP BY cf.responsible
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION stats_mayor_nivel(desde DATE, hasta DATE)
RETURNS TABLE (
  level TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(conduct_category, ''), 'Desconocido') AS level,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY conduct_category
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION stats_promedio_seguimientos_por_caso(desde DATE, hasta DATE)
RETURNS TABLE (
  promedio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(
    ROUND(AVG(cnt)::NUMERIC, 1),
    0
  )::NUMERIC(10,1)
  FROM (
    SELECT COUNT(*) AS cnt
    FROM case_followups cf
    INNER JOIN cases c ON c.id = cf.case_id
    WHERE c.incident_date BETWEEN desde AND hasta
    GROUP BY c.id
  ) sub;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION stats_tiempo_primer_seguimiento(desde DATE, hasta DATE)
RETURNS TABLE (
  promedio_dias NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(
    ROUND(AVG(EXTRACT(EPOCH FROM (primer.action_date::TIMESTAMPTZ - c.created_at)) / 86400)::NUMERIC, 1),
    0
  )::NUMERIC(10,1)
  FROM cases c
  INNER JOIN LATERAL (
    SELECT action_date
    FROM case_followups
    WHERE case_id = c.id
    ORDER BY action_date ASC
    LIMIT 1
  ) primer ON TRUE
  WHERE c.incident_date BETWEEN desde AND hasta;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION stats_casos_por_mes(desde DATE, hasta DATE)
RETURNS TABLE (
  mes TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(incident_date, 'YYYY-MM') AS mes,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY TO_CHAR(incident_date, 'YYYY-MM')
  ORDER BY mes;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION stats_casos_por_tipificacion(desde DATE, hasta DATE)
RETURNS TABLE (
  tipo TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(conduct_type, ''), 'Sin tipificación') AS tipo,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY conduct_type
  ORDER BY COUNT(*) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION stats_casos_por_curso(desde DATE, hasta DATE)
RETURNS TABLE (
  curso TEXT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(NULLIF(course_incident, ''), 'Sin curso') AS curso,
    COUNT(*)::BIGINT AS total
  FROM cases
  WHERE incident_date BETWEEN desde AND hasta
  GROUP BY course_incident
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql STABLE;
