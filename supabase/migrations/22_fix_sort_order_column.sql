-- =====================================================
-- EJECUTAR EN SUPABASE DASHBOARD > SQL Editor
-- Este SQL agrega las columnas faltantes
-- =====================================================

-- 1. Agregar columna sort_order a conduct_types si no existe
ALTER TABLE conduct_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Agregar columna sort_order a conduct_catalog si no existe  
ALTER TABLE conduct_catalog ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3. Actualizar sort_order en conduct_types
UPDATE conduct_types SET sort_order = 1 WHERE type_name = 'Agresión Física';
UPDATE conduct_types SET sort_order = 2 WHERE type_name = 'Agresión Verbal';
UPDATE conduct_types SET sort_order = 3 WHERE type_name = 'Bullying';
UPDATE conduct_types SET sort_order = 4 WHERE type_name = 'Ciberbullying';
UPDATE conduct_types SET sort_order = 5 WHERE type_name = 'Robo';
UPDATE conduct_types SET sort_order = 6 WHERE type_name = 'Vandalismo';
UPDATE conduct_types SET sort_order = 7 WHERE type_name = 'Consumo de Sustancias';
UPDATE conduct_types SET sort_order = 8 WHERE type_name = 'Falta de Respeto';
UPDATE conduct_types SET sort_order = 9 WHERE type_name = 'Otro';

SELECT 'Columnas sort_order agregadas y actualizadas' AS status;
