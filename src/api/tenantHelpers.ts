import { supabase } from './supabaseClient';
import { withRetry } from './withRetry';
import { logger } from '../utils/logger';
import { captureMessage } from '../lib/sentry';

export async function inferTenantFromCase(caseId: string | null) {
  if (!caseId) return null;
  try {
    const { data, error } = await withRetry(() =>
      supabase.from('cases').select('tenant_id').eq('id', caseId).single(),
    );
    if (error) return null;
    return data?.tenant_id || null;
  } catch (e) {
    return null;
  }
}

export function warnMissingTenant(context: string, preview: Record<string, any> = {}) {
  logger.warn(`${context} - missing tenant_id`, { preview });
  try {
    captureMessage(`${context} - missing tenant_id`, 'warning');
  } catch (e) {
    // ignore
  }
}

export default { inferTenantFromCase, warnMissingTenant };
