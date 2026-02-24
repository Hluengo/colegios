import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client for admin tests with RPC and storage behaviors
vi.mock('../supabaseClient', () => {
  class MockQuery {
    table: string;
    constructor(table) {
      this.table = table;
    }
    select() { return this; }
    order() { return this; }
    eq() { return this; }
    update() { return this; }
    insert() { return this; }
    upsert() { return this; }
    delete() { return this; }
    single() { return this; }
    limit() { return this; }
    then(resolve) { return resolve({ data: [], error: null }); }
  }

  const mockStorage = {
    from: (bucket) => ({
      upload: async (path, file, opts) => ({ error: null }),
      getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn.example/${p}` } }),
    }),
  };

  return {
    supabase: {
      from: (table) => new MockQuery(table),
      storage: mockStorage,
      rpc: async (name, args) => ({ data: { ok: true }, error: null }),
      auth: {
        signUp: async ({ email, password, options }) => ({ data: { user: { id: 'u1', email } }, error: null }),
      },
    },
  };
});

import * as admin from '../admin';

describe('admin deep tests', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('uploadTenantBrandAsset uploads and returns path and url', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const res = await admin.uploadTenantBrandAsset('t1', file, 'logo');
    expect(res.bucket).toBe('branding');
    expect(res.path).toContain('tenants/t1/logo/');
    expect(res.url).toContain('https://cdn.example/');
  });

  it('applyCollegeCatalogs calls RPC and returns data', async () => {
    const out = await admin.applyCollegeCatalogs('t1');
    expect(out).toBeTruthy();
  });

  it('onboardCollege calls rpc and returns data', async () => {
    const out = await admin.onboardCollege({ slug: 'demo', name: 'Demo', email: 'a@b.com' });
    expect(out).toBeTruthy();
  });

  it('inviteTenantUser uses auth.signUp and returns user', async () => {
    const user = await admin.inviteTenantUser('t1', { email: 'x@y.com', fullName: 'U' });
    expect(user).toBeTruthy();
    expect((user as any).email).toBe('x@y.com');
  });
});
