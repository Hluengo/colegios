import { supabase } from './supabaseClient';
import type { Json } from '../types/supabase';

export async function listTenants() {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, slug, email, is_active, created_at')
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateTenantBranding(
  tenantId: string,
  payload: Record<string, any>,
) {
  const { data, error } = await supabase
    .from('tenants')
    .update(payload)
    .eq('id', tenantId)
    .select('id, name, slug, email, is_active, created_at, updated_at')
    .single();
  if (error) throw error;
  return data;
}

export async function uploadTenantBrandAsset(
  tenantId: string,
  file: File,
  kind: 'logo' | 'favicon',
) {
  const safeName = file.name.replace(/[^\w.\-()]/g, '_');
  const path = `tenants/${tenantId}/${kind}/${Date.now()}_${safeName}`;
  const bucket = 'branding';

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const url = data?.publicUrl;
  if (!url) throw new Error('No se pudo obtener URL pública del archivo');
  return { bucket, path, url };
}

export async function listTenantSettings(tenantId: string) {
  const { data, error } = await supabase
    .from('tenant_settings')
    .select('id, tenant_id, setting_key, setting_value, created_at')
    .eq('tenant_id', tenantId)
    .order('setting_key', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertTenantSetting(
  tenantId: string,
  settingKey: string,
  settingValue: unknown,
) {
  const { data, error } = await supabase
    .from('tenant_settings')
    .upsert(
      {
        tenant_id: tenantId,
        setting_key: settingKey,
        setting_value: settingValue as Json,
      },
      { onConflict: 'tenant_id,setting_key' },
    )
    .select('id, tenant_id, setting_key, setting_value, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTenantSetting(settingId: string) {
  const { error } = await supabase
    .from('tenant_settings')
    .delete()
    .eq('id', settingId);
  if (error) throw error;
}

export async function listStudents(tenantId: string) {
  const { data, error } = await supabase
    .from('students')
    .select(
      'id, tenant_id, first_name, last_name, rut, course, level, created_at',
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createStudent(
  tenantId: string,
  payload: Record<string, any>,
) {
  const { data, error } = await supabase
    .from('students')
    .insert({
      tenant_id: tenantId,
      first_name: payload.first_name || '',
      last_name: payload.last_name || '',
      rut: payload.rut || null,
      course: payload.course || null,
      level: payload.level || null,
    })
    .select('id, tenant_id, first_name, last_name, rut, course, level, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudent(
  studentId: string,
  payload: Record<string, any>,
) {
  const { data, error } = await supabase
    .from('students')
    .update(payload)
    .eq('id', studentId)
    .select('id, tenant_id, first_name, last_name, rut, course, level, created_at, updated_at')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStudent(studentId: string) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);
  if (error) throw error;
}

export async function importStudents(
  tenantId: string,
  students: Array<{
    first_name?: string;
    last_name?: string;
    rut?: string;
    course?: string;
    level?: string;
  }>,
) {
  if (!students.length) throw new Error('No hay estudiantes para importar');

  const records = students.map((s) => ({
    tenant_id: tenantId,
    first_name: s.first_name || '',
    last_name: s.last_name || '',
    rut: s.rut || null,
    course: s.course || null,
    level: s.level || null,
  }));

  const { data, error } = await supabase
    .from('students')
    .insert(records)
    .select('id, tenant_id, first_name, last_name, rut, course, level, created_at');
  if (error) throw error;
  return data;
}

export async function listConductTypes(_tenantId: string) {
  const { data, error } = await supabase
    .from('conduct_types')
    .select('id, key, label, color, sort_order, active, created_at')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertConductType(
  tenantId: string,
  payload: Record<string, any>,
) {
  const row = {
    key: payload.key,
    label: payload.label,
    color: payload.color || '#64748b',
    sort_order: Number(payload.sort_order || 0),
    active: payload.active ?? true,
  };

  const { data, error } = await supabase
    .from('conduct_types')
    .upsert(row, { onConflict: 'key' })
    .select('id, key, label, color, sort_order, active')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteConductType(id: string) {
  const { error } = await supabase.from('conduct_types').delete().eq('id', id);
  if (error) throw error;
}

export async function listConductCatalog(_tenantId: string) {
  const { data, error } = await supabase
    .from('conduct_catalog')
    .select('id, conduct_type, conduct_category, sort_order, active, created_at')
    .order('conduct_type', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertConductCatalogRow(
  _tenantId: string,
  payload: Record<string, any>,
) {
  const row = {
    conduct_type: payload.conduct_type,
    conduct_category: payload.conduct_category,
    sort_order: Number(payload.sort_order || 0),
    active: payload.active ?? true,
  };

  const { data, error } = await supabase
    .from('conduct_catalog')
    .upsert(row, { onConflict: 'conduct_type,conduct_category' })
    .select('id, conduct_type, conduct_category, sort_order, active')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteConductCatalogRow(id: string) {
  const { error } = await supabase
    .from('conduct_catalog')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function listActionTypes(tenantId: string) {
  const { data, error } = await supabase
    .from('action_types')
    .select('id, tenant_id, key, label, description, sort_order, is_active, created_at')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertActionType(
  tenantId: string,
  payload: Record<string, any>,
) {
  const row = {
    tenant_id: tenantId,
    key: payload.key,
    label: payload.label,
    description: payload.description || null,
    sort_order: Number(payload.sort_order || 0),
    is_active: payload.is_active ?? true,
  };

  const { data, error } = await supabase
    .from('action_types')
    .upsert(row, { onConflict: 'tenant_id,key' })
    .select('id, tenant_id, key, label, description, sort_order, is_active')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteActionType(id: string) {
  const { error } = await supabase.from('action_types').delete().eq('id', id);
  if (error) throw error;
}

export async function listStageSla(_tenantId: string) {
  const { data, error } = await supabase
    .from('stage_sla')
    .select('stage_key, days_to_due')
    .order('stage_key', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateStageSla(
  _tenantId: string,
  stageKey: string,
  payload: Record<string, any>,
) {
  const row = {
    days_to_due: Number(payload.days_to_due || 0),
  };
  const { data, error } = await supabase
    .from('stage_sla')
    .update(row)
    .eq('stage_key', stageKey)
    .select('stage_key, days_to_due')
    .single();
  if (error) throw error;
  return data;
}

export async function upsertStageSla(
  _tenantId: string,
  payload: Record<string, any>,
) {
  const row = {
    stage_key: payload.stage_key,
    days_to_due: Number(payload.days_to_due || 0),
  };

  const { data, error } = await supabase
    .from('stage_sla')
    .upsert(row, { onConflict: 'stage_key' })
    .select('stage_key, days_to_due')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStageSla(stageKey: string) {
  const { error } = await supabase
    .from('stage_sla')
    .delete()
    .eq('stage_key', stageKey);
  if (error) throw error;
}

export async function applyCollegeCatalogs(tenantId: string) {
  const { data, error } = await supabase.rpc('apply_college_catalogs', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return data;
}

export async function onboardCollege(payload: {
  slug: string;
  name: string;
  email: string;
  adminUserId?: string | null;
  subscriptionPlan?: string;
  trialDays?: number;
}) {
  const { data, error } = await supabase.rpc('onboard_college', {
    p_slug: payload.slug,
    p_name: payload.name,
    p_email: payload.email,
    p_admin_user_id: payload.adminUserId || null,
    p_subscription_plan: payload.subscriptionPlan || 'basic',
    p_trial_days: Number(payload.trialDays || 14),
  });
  if (error) throw error;
  return data;
}

export async function listTenantUsers(tenantId: string) {
  const { data, error } = await supabase
    .from('tenant_profiles')
    .select(
      'id, tenant_id, email, full_name, role, phone, department, is_active, last_login_at, created_at, updated_at',
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function inviteTenantUser(
  tenantId: string,
  payload: {
    email: string;
    fullName?: string;
    role?: string;
    department?: string;
  },
) {
  // Usar signUp para crear el usuario - se enviará email de confirmación
  const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: payload.email,
    password: tempPassword,
    options: {
      data: {
        full_name: payload.fullName || '',
        tenant_id: tenantId,
      },
    },
  });

  if (signUpError) throw signUpError;
  if (!signUpData.user) throw new Error('No se pudo crear el usuario');

  // Actualizar perfil con rol y departamento
  const { error: profileError } = await supabase
    .from('tenant_profiles')
    .update({
      full_name: payload.fullName || null,
      role: payload.role || 'user',
      department: payload.department || null,
    })
    .eq('id', signUpData.user.id);

  if (profileError) {
    console.error('Error actualizando perfil:', profileError);
  }

  return signUpData.user;
}

export async function adminUpdateTenantUser(payload: {
  profileId: string;
  fullName?: string | null;
  role?: string | null;
  isActive?: boolean | null;
  phone?: string | null;
  department?: string | null;
}) {
  const { data, error } = await supabase.rpc('admin_update_tenant_profile', {
    p_profile_id: payload.profileId,
    p_full_name: payload.fullName ?? null,
    p_role: payload.role ?? null,
    p_is_active: payload.isActive ?? null,
    p_phone: payload.phone ?? null,
    p_department: payload.department ?? null,
  });
  if (error) throw error;
  return data;
}

export async function listAuditLogs(tenantId: string, limit = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(
      'id, created_at, action, table_name, record_id, user_id, old_values, new_values, admin_note',
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createManualAuditLog(payload: {
  tenantId: string;
  action: string;
  tableName?: string | null;
  note?: string | null;
  recordId?: string | null;
  newValues?: Record<string, any> | null;
}) {
  const { data, error } = await supabase.rpc('admin_create_audit_log', {
    p_tenant_id: payload.tenantId,
    p_action: payload.action,
    p_table_name: payload.tableName || null,
    p_record_id: payload.recordId || null,
    p_note: payload.note || null,
    p_new_values: payload.newValues || null,
  });
  if (error) throw error;
  return data;
}

export async function updateAuditLogNote(auditId: string, note: string) {
  const { data, error } = await supabase.rpc('admin_update_audit_log_note', {
    p_audit_id: auditId,
    p_note: note,
  });
  if (error) throw error;
  return data;
}

export async function deleteAuditLog(auditId: string) {
  const { data, error } = await supabase.rpc('admin_delete_audit_log', {
    p_audit_id: auditId,
  });
  if (error) throw error;
  return data;
}

export async function purgeAuditLogs(tenantId: string, beforeIso: string) {
  const { data, error } = await supabase.rpc('admin_purge_audit_logs', {
    p_tenant_id: tenantId,
    p_before: beforeIso,
  });
  if (error) throw error;
  return data;
}

export async function switchPlatformTenant(tenantId: string) {
  const { data, error } = await supabase.rpc('platform_switch_tenant', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return data;
}
