// =====================================================
// Edge Function: create-tenant
// Crea un nuevo tenant (colegio) en la plataforma
// Requiere ser platform_admin
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CreateTenantRequest {
  slug: string
  name: string
  email: string
  phone?: string
  address?: string
  rut?: string
  subscription_plan?: 'basic' | 'professional' | 'enterprise'
  trial_days?: number
}

Deno.serve(async (req) => {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verificar que es platform_admin
    const { data: profile, error: profileError } = await supabase
      .from('tenant_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'platform_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: requires platform_admin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parsear cuerpo de la solicitud
    const body: CreateTenantRequest = await req.json()

    // Validaciones
    if (!body.slug || !body.name || !body.email) {
      return new Response(JSON.stringify({ error: 'slug, name, and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verificar que el slug no existe
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', body.slug.toLowerCase())
      .single()

    if (existing) {
      return new Response(JSON.stringify({ error: 'Slug already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Configurar trial
    const trialDays = body.trial_days || 14
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + trialDays)

    // Configurar límites según plan
    const planLimits = {
      basic: { max_students: 500, max_users: 10, max_cases_per_month: 100, storage_mb: 1000 },
      professional: { max_students: 2000, max_users: 50, max_cases_per_month: 500, storage_mb: 5000 },
      enterprise: { max_students: -1, max_users: -1, max_cases_per_month: -1, storage_mb: 50000 }
    }

    const plan = body.subscription_plan || 'basic'
    const limits = planLimits[plan]

    // Crear tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        slug: body.slug.toLowerCase(),
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        address: body.address || null,
        rut: body.rut || null,
        subscription_status: 'trial',
        subscription_plan: plan,
        trial_end_date: trialEndDate.toISOString(),
        max_students: limits.max_students,
        max_users: limits.max_users,
        max_cases_per_month: limits.max_cases_per_month,
        storage_mb: limits.storage_mb,
        is_active: true
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Error creating tenant:', tenantError)
      return new Response(JSON.stringify({ error: 'Failed to create tenant' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Crear usuario admin del tenant
    // Nota: El usuario principal se crea por invitación, no aquí

    // Obtener versión actual de la plataforma
    const { data: version } = await supabase
      .from('platform_versions')
      .select('id')
      .eq('is_active', true)
      .order('released_at', { ascending: false })
      .limit(1)
      .single()

    // Registrar versión del tenant
    if (version) {
      await supabase
        .from('tenant_versions')
        .insert({
          tenant_id: tenant.id,
          version_id: version.id,
          auto_update_enabled: true
        })
    }

    // Crear catálogos por defecto
    await createDefaultCatalogs(tenant.id)

    return new Response(JSON.stringify({ 
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        trial_end_date: tenant.trial_end_date
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in create-tenant:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function createDefaultCatalogs(tenantId: string) {
  // Catálogos por defecto para un nuevo tenant
  const defaultCatalogs = [
    // Tipos de conducta
    { catalog_type: 'conduct_types', key: 'agresion_fisica', label: 'Agresión Física', display_order: 1 },
    { catalog_type: 'conduct_types', key: 'agresion_verbal', label: 'Agresión Verbal', display_order: 2 },
    { catalog_type: 'conduct_types', key: 'bullying', label: 'Bullying/Ciberbullying', display_order: 3 },
    { catalog_type: 'conduct_types', key: 'robo', label: 'Robo', display_order: 4 },
    { catalog_type: 'conduct_types', key: 'vandalismo', label: 'Vandalismo', display_order: 5 },
    { catalog_type: 'conduct_types', key: 'consumo_sustancias', label: 'Consumo de Sustancias', display_order: 6 },
    { catalog_type: 'conduct_types', key: 'falta_respeto', label: 'Falta de Respeto', display_order: 7 },
    { catalog_type: 'conduct_types', key: 'otro', label: 'Otro', display_order: 99 },

    // Categorías
    { catalog_type: 'conduct_categories', key: 'leve', label: 'Leve', display_order: 1 },
    { catalog_type: 'conduct_categories', key: 'grave', label: 'Grave', display_order: 2 },
    { catalog_type: 'conduct_categories', key: 'gravisima', label: 'Gravísima', display_order: 3 },

    // Estados de caso
    { catalog_type: 'case_status', key: 'reportado', label: 'Reportado', display_order: 1 },
    { catalog_type: 'case_status', key: 'en_seguimiento', label: 'En Seguimiento', display_order: 2 },
    { catalog_type: 'case_status', key: 'cerrado', label: 'Cerrado', display_order: 3 },

    // Tipos de acción
    { catalog_type: 'action_types', key: 'seguimiento', label: 'Seguimiento', display_order: 1 },
    { catalog_type: 'action_types', key: 'entrevista', label: 'Entrevista', display_order: 2 },
    { catalog_type: 'action_types', key: 'citacion', label: 'Citación', display_order: 3 },
    { catalog_type: 'action_types', key: 'derivacion', label: 'Derivación', display_order: 4 },
    { catalog_type: 'action_types', key: 'medida_disciplinaria', label: 'Medida Disciplinaria', display_order: 5 },

    // Roles de involucrados
    { catalog_type: 'roles', key: 'agresor', label: 'Agresor', display_order: 1 },
    { catalog_type: 'roles', key: 'victima', label: 'Víctima', display_order: 2 },
    { catalog_type: 'roles', key: 'testigo', label: 'Testigo', display_order: 3 },
    { catalog_type: 'roles', key: 'denunciante', label: 'Denunciante', display_order: 4 }
  ]

  const catalogsToInsert = defaultCatalogs.map(c => ({
    ...c,
    tenant_id: tenantId,
    is_active: true
  }))

  const { error: catalogsError } = await supabase
    .from('tenant_catalogs')
    .insert(catalogsToInsert)

  if (catalogsError) {
    console.error('Error creating default catalogs:', catalogsError)
  }
}
