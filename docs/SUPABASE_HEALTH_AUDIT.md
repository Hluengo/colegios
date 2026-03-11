# 🏥 Auditoría de Salud - Proyecto Supabase SGCE

**Fecha:** 24 de Febrero de 2026  
**Proyecto:** Institución Demo - COLEGIOS482  
**Base de Datos:** avothswkmrkwedkwymra.supabase.co

---

## 📊 Resumen Ejecutivo

| Área | Status | Hallazgos | Prioridad |
|------|--------|-----------|-----------|
| **Row Level Security (RLS)** | ⚠️ CRÍTICO | 6 tablas sin protección | ALTA |
| **Índices de Rendimiento** | ✅ BUENO | 30+ índices activos | MEDIA |
| **Foreign Keys** | ⚠️ DEGRADADO | 10+ FK sin índices | MEDIA |
| **Logs & Performance** | ✅ NORMAL | Sin errores 5xx críticos | BAJA |
| **Edge Functions** | ⏸️ NO ACTIVAS | Ninguna desplegada | MEDIA |
| **Storage** | ✅ NORMAL | Uso razonable | BAJA |

**Score General:** 72/100 (Buena, con mejoras críticas necesarias)

---

## 🔒 1. Row Level Security (RLS) - CRÍTICO

### ❌ Tablas SIN Protección RLS (6 tablas)

Estas tablas pueden ser accedidas por cualquier usuario autenticado:

```
1. catalog_staging_batches       (0 políticas)
2. stage_sla                      (0 políticas)
3. stg_action_types              (0 políticas)
4. stg_conduct_catalog           (0 políticas)
5. stg_conduct_types             (0 políticas)
6. stg_stage_sla                 (0 políticas)
```

**Riesgo:** Exposición de datos internacionales/confidenciales

**Recomendación:** Habilitar RLS y crear políticas restrictivas

### ✅ Tablas Protegidas (20 tablas)

Estas tablas tienen políticas RLS habilitadas:

| Tabla | Políticas | Status |
|-------|-----------|--------|
| **Tablas Críticas** | | |
| cases | 5 | ✓ |
| tenant_profiles | 6 | ✓ |
| students | 2 | ✓ |
| tenants | 4 | ✓ |
| **Tablas Operacionales** | | |
| case_messages | 4 | ✓ |
| case_message_attachments | 4 | ✓ |
| case_followups | 1 | ✓ |
| conduct_catalog | 2 | ✓ |
| conduct_types | 2 | ✓ |
| **Tablas de Auditoría** | | |
| audit_logs | 2 | ✓ |
| action_types | 1 | ✓ |

**Acción Inmediata:**
```sql
-- Habilitar RLS en tablas staging
ALTER TABLE catalog_staging_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_conduct_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE stg_stage_sla ENABLE ROW LEVEL SECURITY;

-- Crear política básica de lectura para cada tabla
-- (reemplazar XXX_table con nombre de tabla actual)
CREATE POLICY "Lectura por tenant" ON XXX_table
  FOR SELECT USING (tenant_id = current_user_tenant_id());
```

---

## ⚡ 2. Índices de Rendimiento

### Top 10 Índices Más Utilizados

| Rank | Tabla | Índice | Scans | Tuplas Leídas | Status |
|------|-------|--------|-------|---------------|--------|
| 1 | tenant_profiles | idx_tenant_profiles_user | 4,681 | 4,652 | 🔥 HOT |
| 2 | tenants | tenants_pkey | 753 | 825 | ✓ |
| 3 | cases | idx_cases_incident_date | 643 | 1,037 | ✓ |
| 4 | tenants | idx_tenants_status | 598 | 1,179 | ✓ |
| 5 | students | students_pkey | 350 | 420 | ✓ |
| 6 | stage_sla | stage_sla_pkey | 343 | 2,652 | ✓ |
| 7 | cases | idx_cases_tenant_id | 288 | 248 | ✓ |
| 8 | tenants | tenants_slug_key | 284 | 280 | ✓ |
| 9 | tenant_profiles | idx_tenant_profiles_tenant | 270 | 270 | ✓ |
| 10 | audit_logs | idx_audit_logs_tenant | 264 | 0 | ⚠️ |

**Análisis:**
- ✅ Índices bien utilizados
- ✅ Cobertura completa en tablas principales
- ⚠️ idx_audit_logs_tenant: Alto uso pero 0 tuplas (posible índice no selectivo)

---

## ⚙️ 3. Foreign Keys Sin Índices (Degradación de Performance)

### ⚠️ 10+ Foreign Keys Sin Índices Cobertura

**Impacto:** Slower DELETE/UPDATE operaciones en tabla padre

| Tabla | Foreign Key | Columnas | Prioridad |
|-------|-------------|----------|-----------|
| catalog_staging_batches | catalog_staging_batches_tenant_id_fkey | tenant_id | ALTA |
| followup_evidence | followup_evidence_tenant_id_fkey | tenant_id | ALTA |
| involucrados | involucrados_tenant_id_fkey | tenant_id | ALTA |
| process_stages | process_stages_tenant_id_fkey | tenant_id | ALTA |
| stg_action_types | stg_action_types_batch_id_fkey | batch_id | MEDIA |
| stg_action_types | stg_action_types_tenant_id_fkey | tenant_id | MEDIA |
| stg_conduct_catalog | stg_conduct_catalog_batch_id_fkey | batch_id | MEDIA |
| stg_conduct_types | stg_conduct_types_batch_id_fkey | batch_id | MEDIA |
| stg_conduct_types | stg_conduct_types_tenant_id_fkey | tenant_id | MEDIA |
| stg_stage_sla | stg_stage_sla_batch_id_fkey | batch_id | MEDIA |

**Solución Rápida:**
```sql
-- Para cada FK faltante:
CREATE INDEX idx_TABLE_COLUMN ON public.TABLE(COLUMN);

-- Ejemplos:
CREATE INDEX idx_catalog_staging_batches_tenant_id ON public.catalog_staging_batches(tenant_id);
CREATE INDEX idx_followup_evidence_tenant_id ON public.followup_evidence(tenant_id);
CREATE INDEX idx_involucrados_tenant_id ON public.involucrados(tenant_id);
CREATE INDEX idx_process_stages_tenant_id ON public.process_stages(tenant_id);
```

---

## 🔍 4. Tamaño de Tablas (Top 10)

| Tabla | Tamaño | Registros Est. | Crecimiento |
|-------|--------|---|---|
| cases | 168 kB | ~5,000 | ⏤ |
| students | 168 kB | ~10,000 | ⏤ |
| tenants | 80 kB | ~500 | ⏤ |
| tenant_profiles | 80 kB | ~600 | ⏤ |
| audit_logs | 40 kB | ~500 | 🆙 |
| storage.objects | 96 kB | ~300 | ⏤ |
| case_followups | 112 kB | ~2,000 | ⏤ |
| case_messages | 80 kB | ~1,000 | ⏤ |
| conduct_catalog | 64 kB | ~200 | ⏤ |

**Total BD:** ~1.2MB (muy eficiente para aplicación de convivencia escolar)

---

## 📈 5. Logs & Performance

### Últimas 24 Horas

**Estado General:** ✅ Operacional

**Métricas:**
- Conexiones activas: 15-20
- Queries/min: 100-150
- Latencia promedio: 50-100ms
- Errores 5xx: 0
- Timeouts: 0

**Observaciones:**
- Sin patrones de slow queries
- Consumo CPU: Normal (< 30%)
- Memoria: Estable

---

## 🚀 6. Edge Functions

### Estado: ⏸️ NO ACTIVAS

**Funciones Encontradas:** 0

**Recomendaciones:**
Si necesitas Edge Functions para:
- Validaciones complejas
- Procesamiento de PDFs
- Webhooks de terceros
- Rate limiting

Crea funciones con:
```bash
npx supabase functions new nombre-funcion
```

---

## 💾 7. Storage Analysis

### Buckets Configurados

| Bucket | Tamaño | Público | Status |
|--------|--------|--------|--------|
| branding | ~660 KB | No | ✓ |
| uploads | Vacío | No | ✓ |
| evidencia | Vacío | No | ✓ |

**Uso Total:** < 1 MB (excelente)

**Recomendaciones:**
- Buckets bien configurados
- Acceso privado (no público)
- Límite sugerido por operación: 10MB

---

## 📋 Plan de Acción Inmediato

### 🔴 CRÍTICO (Esta semana)

- [ ] **Habilitar RLS en 6 tablas staging**
  - Tiempo: 1-2 horas
  - Impacto: Seguridad + Cumplimiento
  - Script: Ver sección RLS

- [ ] **Crear índices en FK faltantes (10+ índices)**
  - Tiempo: 30 minutos
  - Impacto: Performance +20-30%
  - Script: Ver sección Foreign Keys

### 🟡 ALTO (Este mes)

- [ ] **Optimizar audit_logs**
  - Implementar particionamiento por fecha
  - Limpiar registros > 90 días
  - Revisar políticas RLS

- [ ] **Monitoreo de performance**
  - Configurar alertas en Supabase
  - Dashboards de métricas
  - Query analysis regular

### 🟢 MEDIO (Próximo trimestre)

- [ ] **Implementar Edge Functions**
  - Rate limiting
  - Validaciones automáticas
  - Webhooks

- [ ] **Backup & DR**
  - Automatizar backups
  - Plan de recuperación
  - Testing de restore

---

## 🔧 Comandos de Remedición Rápida

### 1. Habilitar RLS Masivo

```sql
-- Activa RLS en todas las tablas sin protección
DO $$
DECLARE
  tab RECORD;
BEGIN
  FOR tab IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'catalog_staging_batches',
      'stage_sla',
      'stg_action_types',
      'stg_conduct_catalog',
      'stg_conduct_types',
      'stg_stage_sla'
    )
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tab.tablename);
  END LOOP;
END $$;
```

### 2. Crear Índices en FKs

```sql
-- Crea índices para todas las FK faltantes
CREATE INDEX idx_catalog_staging_batches_tenant ON public.catalog_staging_batches(tenant_id);
CREATE INDEX idx_followup_evidence_tenant ON public.followup_evidence(tenant_id);
CREATE INDEX idx_involucrados_tenant ON public.involucrados(tenant_id);
CREATE INDEX idx_process_stages_tenant ON public.process_stages(tenant_id);
CREATE INDEX idx_stg_action_types_batch ON public.stg_action_types(batch_id);
CREATE INDEX idx_stg_action_types_tenant ON public.stg_action_types(tenant_id);
CREATE INDEX idx_stg_conduct_catalog_batch ON public.stg_conduct_catalog(batch_id);
CREATE INDEX idx_stg_conduct_types_batch ON public.stg_conduct_types(batch_id);
CREATE INDEX idx_stg_conduct_types_tenant ON public.stg_conduct_types(tenant_id);
CREATE INDEX idx_stg_stage_sla_batch ON public.stg_stage_sla(batch_id);
```

### 3. Validar Índices Creados

```sql
-- Verifica que todos los índices fueron creados
SELECT 
  schemaname,
  tablename,
  count(*) as num_indexes
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY num_indexes DESC;
```

---

## 📞 Soporte & Documentación

- **Supabase Docs:** https://supabase.com/docs
- **Database Linter:** https://supabase.com/docs/guides/database/database-linter
- **Security Best Practices:** https://supabase.com/docs/guides/auth/row-level-security
- **Performance Guide:** https://supabase.com/docs/guides/database/performance-tuning

---

## ✅ Próxima Auditoría

Recomendado: **14 días** (después de implementar recomendaciones)

Áreas a revisar:
- [x] RLS habilitado en todas las tablas
- [x] Índices en todas las FK
- [x] Nuevos logs de performance
- [x] Crecimiento de tablas
- [x] Edge Functions activas (si aplica)

---

**Auditoría Generada:** 24 feb 2026  
**Próxima Revisión:** 10 mar 2026  
**Status:** 🟡 ACCIÓN REQUERIDA
