import { describe, it, expect } from 'vitest';
import * as admin from './../../../api/admin';

describe('admin - basic unit checks', () => {
  it('exports core functions', () => {
    expect(admin.listTenants).toBeTypeOf('function');
    expect(admin.updateTenantBranding).toBeTypeOf('function');
    expect(admin.uploadTenantBrandAsset).toBeTypeOf('function');
    expect(admin.upsertTenantSetting).toBeTypeOf('function');
    expect(admin.importStudents).toBeTypeOf('function');
    expect(admin.onboardCollege).toBeTypeOf('function');
    expect(admin.inviteTenantUser).toBeTypeOf('function');
  });

  it('exports tenant user helpers', () => {
    expect(admin.listTenantUsers).toBeTypeOf('function');
    expect(admin.adminUpdateTenantUser).toBeTypeOf('function');
    expect(admin.listAuditLogs).toBeTypeOf('function');
  });
});
