// =====================================================
// Edge Function: on-auth-hook
// Se ejecuta cuando un usuario se registra o actualiza en auth
// Crea/actualiza el perfil en la tabla tenant_profiles
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { inferTenantFromSlug, warnMissingTenant } from '../../_shared/tenantHelpers.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UserMetadata {
  tenant_slug?: string;
  provider?: string;
  full_name?: string;
}

interface AuthUser {
  id: string;
  email: string;
  user_metadata: UserMetadata;
}

Deno.serve(async (req) => {
  try {
    // Verificar que es un webhook válido
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Este webhook viene de Supabase Auth, no necesita verificación adicional
    const eventType = req.headers.get('x-supabase-event');

    if (!eventType) {
      return new Response(JSON.stringify({ error: 'No event type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user: AuthUser = await req.json();

    console.log(`Processing auth event: ${eventType} for user: ${user.id}`);

    switch (eventType) {
      case 'INSERT':
        // Usuario nuevo registrado
        await handleNewUser(user);
        break;

      case 'UPDATE':
        // Usuario actualizado
        await handleUserUpdate(user);
        break;

      case 'DELETE':
        // Usuario eliminado
        await handleUserDelete(user.id);
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in auth-hook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function handleNewUser(user: AuthUser) {
  // Verificar que el proveedor sea email (no Google, GitHub, etc.)
  const provider = user.user_metadata?.provider;

  if (provider && provider !== 'email') {
    console.log(
      `Rejected user ${user.id}: OAuth provider '${provider}' not allowed. Only email registration is permitted.`,
    );
    throw new Error(
      `Registration with ${provider} is not allowed. Please use email and password.`,
    );
  }

  // Obtener el tenant_slug de los metadatos
  const tenantSlug = user.user_metadata?.tenant_slug;

  if (!tenantSlug) {
    console.log(
      `No tenant_slug provided for user ${user.id}, skipping profile creation`,
    );
    return;
  }

  // Inferir tenant por slug usando helper
  const tenantId = await inferTenantFromSlug(supabase, tenantSlug);

  if (!tenantId) {
    await warnMissingTenant('on-auth-hook.handleNewUser', { userId: user.id, tenantSlug });
    console.error(`Tenant not found: ${tenantSlug}`);
    return;
  }

  // Determinar rol (primer usuario = tenant_admin, otros = user)
  const { count } = await supabase
    .from('tenant_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const role = count === 0 ? 'tenant_admin' : 'user';

  // Crear perfil
  const { error: profileError } = await supabase
    .from('tenant_profiles')
    .insert({
      id: user.id,
      tenant_id: tenantId,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      role: role,
      is_active: true,
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    throw profileError;
  }

  console.log(
    `Profile created for user ${user.id} with role ${role} in tenant ${tenantId}`,
  );
}

async function handleUserUpdate(user: AuthUser) {
  // Actualizar email en perfil si cambió
  const { error: updateError } = await supabase
    .from('tenant_profiles')
    .update({
      email: user.email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating profile:', updateError);
  }
}

async function handleUserDelete(userId: string) {
  // Soft delete del perfil
  const { error: deleteError } = await supabase
    .from('tenant_profiles')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (deleteError) {
    console.error('Error deactivating profile:', deleteError);
  }
}
