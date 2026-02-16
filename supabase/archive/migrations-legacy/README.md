# Legacy SQL Archive

Esta carpeta guarda scripts SQL históricos que ya no forman parte del flujo canónico de migraciones.

Archivos movidos aquí:
- `COMPLETE_migration.sql`
- `PART1_tables_no_auth.sql`
- `PART2_setup.sql`
- `PART3_views_full.sql`
- `PART3_views_simple.sql`
- `PART4_seed_catalogs.sql`
- `PART5_fix_catalogs_and_data.sql`
- `PART6_create_app_tables.sql`

Motivo:
- Evitar ejecución accidental de esquemas antiguos/incompatibles con las migraciones actuales (`29+`, `30+`, `31+`, `32+`).
