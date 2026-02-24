# Runbook de Despliegue (Produccion)

## Objetivo

Aplicar migraciones de base de datos de forma segura y validar que el backend
quede operativo para la app.

## Alcance

- Carpeta canonica: `supabase/migrations/`
- Scripts legacy: `supabase/archive/migrations-legacy/` (no ejecutar)

## Pre-checks

1. Confirmar respaldo de base de datos (snapshot/backup).
2. Confirmar rama/tag de codigo que se desplegara.
3. Confirmar que `supabase/migrations/` no contiene archivos legacy.

## Orden de aplicacion

1. Ejecutar migraciones en orden lexicografico de `supabase/migrations/`.
2. En esta base, la secuencia activa termina en:
   `32_platform_switch_tenant.sql`.
3. No mezclar ejecucion manual de `PART*` o `COMPLETE_migration.sql`.

## Comandos sugeridos (CLI)

```bash
supabase db push
```

Si se usa SQL Editor manual, ejecutar en orden por nombre de archivo.

## Verificacion post-deploy

Ejecutar:

```sql
\i supabase/diagnostics/post_deploy_checks.sql
```

Si no usas `psql`, copiar el contenido del script y correrlo en SQL Editor.

## Criterios de exito

1. Existen tablas y vistas criticas:
   `tenants`, `tenant_profiles`, `conduct_types`, `conduct_catalog`,
   `action_types`, `stage_sla`, `v_control_unificado`.
2. Existen RPCs criticas:
   `apply_college_catalogs`, `onboard_college`, `platform_switch_tenant`,
   `admin_update_tenant_profile`.
3. No hay errores de permiso sobre lectura/escritura desde frontend admin.

## Rollback rapido (operativo)

1. Restaurar backup/snapshot previo.
2. Desplegar version de app asociada al esquema previo.
3. Repetir despliegue en ambiente de staging antes de reintentar produccion.
