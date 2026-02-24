import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks: reemplazar el cliente supabase usado por `admin.ts`
vi.mock('./../../../api/supabaseClient', () => {
  const upload = vi.fn(async () => ({ error: null }));
  const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://cdn.test/branding.png' } }));

  const storageFrom = vi.fn(() => ({ upload, getPublicUrl }));

  const signUp = vi.fn(async () => ({ data: { user: { id: 'u-123' } }, error: null }));

  const from = vi.fn(() => ({
    update: () => ({ eq: async () => ({ error: null }) }),
    insert: () => ({ select: () => ({}) }),
  }));

  const rpc = vi.fn(async () => ({ data: { ok: true }, error: null }));

  return {
    supabase: {
      storage: { from: storageFrom },
      auth: { signUp },
      from,
      rpc,
    },
  };
});

import * as admin from './../../../api/admin';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('admin behavior - mocked supabase', () => {
  it('uploadTenantBrandAsset uploads and returns url/path', async () => {
    const file = { name: 'logo.png', type: 'image/png' } as any;
    const out = await admin.uploadTenantBrandAsset('tenant-1', file, 'logo');
    expect(out.bucket).toBe('branding');
    expect(out.url).toBe('https://cdn.test/branding.png');
    expect(out.path).toContain('tenants/tenant-1/logo/');
  });

  it('inviteTenantUser signs up and returns created user', async () => {
    const user = await admin.inviteTenantUser('t1', { email: 'u@example.com', fullName: 'Test User', role: 'admin' });
    expect(user).toBeDefined();
    expect((user as any).id).toBe('u-123');
  });

  it('onboardCollege calls rpc and returns data', async () => {
    const data = await admin.onboardCollege({ slug: 's1', name: 'S1', email: 's1@e', adminUserId: null, subscriptionPlan: 'basic', trialDays: 7 });
    expect(data).toMatchObject({ ok: true });
  });
});
