// =====================================================
// Edge Function: stripe-webhook
// Procesa eventos de Stripe para suscripciones
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { warnMissingTenant } from '../../_shared/tenantHelpers.ts';
import Stripe from 'https://esm.sh/stripe@13?target=deno';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  // Solo POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeWebhookSecret,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Procesar eventos
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in stripe-webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Buscar tenant por customer_id
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!tenant) {
    console.log(`Tenant not found for customer: ${customerId}`);
    await warnMissingTenant('stripe-webhook.handleSubscriptionCreated', { customerId, subscriptionId: subscription.id });
    return;
  }

  // Determinar plan
  const plan = getPlanFromPrice(subscription.items.data[0]?.price.id);
  const status =
    subscription.status === 'active'
      ? 'active'
      : subscription.status === 'trialing'
        ? 'trial'
        : 'suspended';

  // Actualizar tenant
  await supabase
    .from('tenants')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      subscription_plan: plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  console.log(
    `Subscription created for tenant ${tenant.id}: ${subscription.id}`,
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!tenant) {
    console.log(`Tenant not found for customer: ${customerId}`);
    await warnMissingTenant('stripe-webhook.handleSubscriptionUpdated', { customerId, subscriptionId: subscription.id });
    return;
  }

  const plan = getPlanFromPrice(subscription.items.data[0]?.price.id);
  const status =
    subscription.status === 'active'
      ? 'active'
      : subscription.status === 'trialing'
        ? 'trial'
        : 'suspended';

  await supabase
    .from('tenants')
    .update({
      subscription_status: status,
      subscription_plan: plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  console.log(`Subscription updated for tenant ${tenant.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!tenant) {
    console.log(`Tenant not found for customer: ${customerId}`);
    await warnMissingTenant('stripe-webhook.handleSubscriptionDeleted', { customerId, subscriptionId: subscription.id });
    return;
  }

  await supabase
    .from('tenants')
    .update({
      stripe_subscription_id: null,
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  console.log(`Subscription cancelled for tenant ${tenant.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!tenant) {
    console.log(`Tenant not found for customer: ${customerId}`);
    await warnMissingTenant('stripe-webhook.handlePaymentSucceeded', { customerId, invoiceId: invoice.id });
    return;
  }

  // Reiniciar estado si estaba suspendido por falta de pago
  await supabase
    .from('tenants')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.id)
    .neq('subscription_status', 'active');

  console.log(`Payment succeeded for tenant ${tenant.id}`);

  // Aquí se podría enviar email de confirmación
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!tenant) {
    console.log(`Tenant not found for customer: ${customerId}`);
    await warnMissingTenant('stripe-webhook.handlePaymentFailed', { customerId, invoiceId: invoice.id });
    return;
  }

  // Suspender tenant
  await supabase
    .from('tenants')
    .update({
      subscription_status: 'suspended',
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.id);

  console.log(`Payment failed, tenant suspended: ${tenant.id}`);

  // Aquí se podría enviar email de notificación de pago fallido
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  // Este evento puede ser útil si necesitamos registrar el customer_id
  // antes de crear la suscripción
  console.log(`Customer created: ${customer.id}`);
}

function getPlanFromPrice(priceId: string | undefined): string {
  if (!priceId) return 'basic';

  // Mapear price IDs a planes
  // Estos IDs se configuran en el dashboard de Stripe
  const priceToPlan: Record<string, string> = {
    price_basic_monthly: 'basic',
    price_basic_yearly: 'basic',
    price_professional_monthly: 'professional',
    price_professional_yearly: 'professional',
    price_enterprise_monthly: 'enterprise',
    price_enterprise_yearly: 'enterprise',
  };

  return priceToPlan[priceId] || 'basic';
}
