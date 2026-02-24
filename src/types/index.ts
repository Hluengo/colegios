/**
 * Tipos TypeScript para la aplicación de Convivencia Escolar
 * Fase 1: Tipos básicos para el dominio de casos
 */

// ============================================
// TIPOS DE ESTADO Y CATEGORÍAS
// ============================================

export type CaseStatus = 'Reportado' | 'En Seguimiento' | 'Cerrado';

export type ConductType = 'Leve' | 'Grave' | 'Muy Grave' | 'Gravísima';

export type StudentRole = 'Afectado' | 'Agresor' | 'Testigo' | 'Denunciante';

// ============================================
// INTERFACES PRINCIPALES
// ============================================

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  rut: string;
  course?: string;
}

export interface Case {
  id: string;
  student_id: string;
  legacy_case_number?: string;
  incident_date: string;
  incident_time: string;
  course_incident: string;
  conduct_type: string;
  conduct_category: string;
  short_description: string;
  status: CaseStatus;
  created_at: string;
  updated_at?: string;
  closed_at?: string;
  indagacion_start_date?: string;
  indagacion_due_date?: string;
  seguimiento_started_at?: string;
  due_process_closed_at?: string;
  responsible?: string;
  responsible_role?: string;
  final_resolution_text?: string;
  final_disciplinary_measure?: string;
  closed_by_name?: string;
  closed_by_role?: string;
  final_pdf_storage_path?: string;
  // Relaciones
  students?: Student[];
}

export interface CaseListItem {
  id: string;
  created_at: string;
  incident_date: string;
  incident_time: string;
  status: string;
  conduct_type: string;
  conduct_category?: string;
  short_description?: string;
  course_incident: string;
  responsible?: string;
  responsible_role?: string;
  closed_at?: string;
  seguimiento_started_at?: string;
  indagacion_due_date?: string;
  students?: Student[];
}

// ============================================
// TIPOS PARA FILTROS Y PAGINACIÓN
// ============================================

export interface CaseFilters {
  status?: CaseStatus | null;
  excludeStatus?: CaseStatus | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  rows: T[];
  total: number;
}

// ============================================
// TIPOS PARA INVOLUCRADOS
// ============================================

export interface Involved {
  id: string;
  case_id: string;
  student_id?: string;
  nombre: string;
  rol: StudentRole;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

// ============================================
// TIPOS PARA SEGUIMIENTOS
// ============================================

export interface FollowUp {
  id: string;
  case_id: string;
  action_date?: string;
  action_at?: string;
  created_at: string;
  action_type: string;
  process_stage?: string;
  detail?: string;
  responsible?: string;
  observations?: string;
  due_date?: string;
  due_at?: string;
  description?: string;
  evidence_files?: EvidenceFile[];
}

export interface EvidenceFile {
  id: string;
  name: string;
  path: string;
  url?: string;
}

// ============================================
// TIPOS PARA ALERTAS Y PLAZOS
// ============================================

export interface Alert {
  id: string;
  tipo: string;
  followup_id?: string;
  case_id: string;
  legacy_case_number?: string;
  estado_caso?: string;
  tipificacion_conducta?: string;
  fecha_incidente?: string;
  curso_incidente?: string;
  fecha?: string;
  tipo_accion?: string;
  estado_etapa?: string;
  responsable?: string;
  detalle?: string;
  etapa_debido_proceso?: string;
  descripcion?: string;
  fecha_plazo?: string;
  dias_restantes?: number;
  alerta_urgencia?: string;
  student_id?: string;
  estudiante?: string;
  estudiante_rut?: string;
  course?: string;
  level?: string;
}

// ============================================
// TIPOS PARA CATÁLOGO DE CONDUCTAS
// ============================================

export interface ConductTypeConfig {
  id: string;
  key: string;
  label: string;
  color?: string;
  sort_order?: number;
  active?: boolean;
}

export interface ConductCatalogRow {
  id: string;
  conduct_type: string;
  conduct_category: string;
  sort_order?: number;
  active?: boolean;
}

// ============================================
// TIPOS PARA TOASTS Y NOTIFICACIONES
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id?: number;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

// ============================================
// TIPOS PARA CONFIGURACIÓN
// ============================================

export interface BrandingConfig {
  appName: string;
  schoolName: string;
  logoApp: string;
  primaryColor?: string;
}

// ============================================
// UTILIDADES DE TIPO
// ============================================

/**
 * Tipo para funciones async con manejo de errores
 */
export type AsyncFunction<T> = () => Promise<T>;

/**
 * Tipo para callback de useEffect
 */
export type EffectCallback = () => void | (() => void);

/**
 * Tipo para opciones de caché
 */
export interface CacheOptions {
  ttlMs?: number;
  revalidate?: boolean;
}

// ============================================
// TIPOS PARA MULTI-TENANCY
// ============================================

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  rut?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled' | string;
  subscription_plan: 'basic' | 'professional' | 'enterprise' | string;
  trial_end_date?: string;
  timezone: string;
  locale: string;
  date_format: string;
  features: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  email: string;
  full_name?: string;
  role: 'platform_admin' | 'tenant_admin' | 'user' | 'readonly' | string;
  avatar_url?: string;
  is_active: boolean;
}

export interface TenantCatalog {
  id: string;
  tenant_id: string;
  catalog_type: string;
  key: string;
  label: string;
  description?: string;
  metadata?: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
}

// Plan limits
export const PLAN_LIMITS = {
  basic: {
    max_students: 500,
    max_users: 10,
    max_cases_per_month: 100,
    storage_mb: 1000,
  },
  professional: {
    max_students: 2000,
    max_users: 50,
    max_cases_per_month: 500,
    storage_mb: 5000,
  },
  enterprise: {
    max_students: -1,
    max_users: -1,
    max_cases_per_month: -1,
    storage_mb: 50000,
  },
} as const;
