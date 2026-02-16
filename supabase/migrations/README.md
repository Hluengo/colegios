# Supabase Migrations

## Estado actual

La carpeta `supabase/migrations` contiene la línea canónica de migraciones usada por la app.

- Migraciones activas: `00_...` a `32_...`
- Baseline funcional: `BASELINE_2026-02-14.md`

## Regla operativa

1. Agregar solo migraciones nuevas e idempotentes en `supabase/migrations`.
2. No volver a ejecutar scripts históricos agregados fuera de la secuencia canónica.
3. Para cambios de esquema, preferir una migración incremental en lugar de editar migraciones antiguas.

## Scripts legacy

Los scripts consolidados/particionados históricos se movieron a:

- `supabase/archive/migrations-legacy/`

No deben ejecutarse como parte del flujo normal de despliegue.

## Verificación mínima recomendada

```sql
select to_regclass('public.v_control_unificado');
select to_regclass('public.conduct_types');
select to_regclass('public.conduct_catalog');
select to_regclass('public.stage_sla');
```

Si alguna devuelve `null`, falta aplicar migraciones en el entorno.
