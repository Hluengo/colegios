// Helper utilities para funciones Deno en supabase/functions
export async function inferTenantFromSlug(supabase: any, slug: string | undefined) {
  if (!slug) return null;
  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !tenant) return null;
    return tenant.id;
  } catch (err) {
    console.warn('inferTenantFromSlug error', err);
    return null;
  }
}

export async function inferTenantFromCaseId(supabase: any, caseId: string | undefined) {
  if (!caseId) return null;
  try {
    const { data: c, error } = await supabase
      .from('cases')
      .select('tenant_id')
      .eq('id', caseId)
      .single();

    if (error || !c) return null;
    return c.tenant_id || null;
  } catch (err) {
    console.warn('inferTenantFromCaseId error', err);
    return null;
  }
}

export async function warnMissingTenant(context: string, payload: any) {
  try {
    const preview = typeof payload === 'string' ? payload : JSON.stringify(payload || {}).slice(0, 1000);
    const msg = `[tenantHelpers] missing tenant - ${context} - ${preview}`;
    console.warn(msg);

    // Optional: forward to a monitoring endpoint if configured
    const monitorUrl = Deno.env.get('TENANT_MISSING_MONITOR_URL');
    if (monitorUrl) {
      try {
        await fetch(monitorUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, preview }),
        });
      } catch (e) {
        // Don't fail the function for monitoring errors
        console.warn('Failed sending tenant missing monitor:', e);
      }
    }
  } catch (e) {
    console.warn('warnMissingTenant error', e);
  }
}
