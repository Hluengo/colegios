import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist-safe mock factory for './supabaseClient'. Exposes `__setMocks` to update
// behavior from tests without relying on top-level variables (avoids hoisting issues).
vi.mock('./supabaseClient', () => {
  let storageFromImpl = (bucket: string) => ({
    getPublicUrl: () => ({ data: null }),
    createSignedUrl: async () => ({ data: { signedUrl: null } }),
    upload: async () => ({ error: null }),
    remove: async () => ({ error: null }),
  });
  let fromImpl = (table: string) => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
    delete: () => ({ eq: async () => ({ error: null }) }),
  });
  return {
    supabase: {
      storage: { from: (b: string) => storageFromImpl(b) },
      from: (t: string) => fromImpl(t),
    },
    __setMocks: (s: any, f: any) => {
      storageFromImpl = s;
      fromImpl = f;
    },
  };
});
vi.mock('./withRetry', () => ({ withRetry: (fn: any) => fn() }));

import {
  getEvidencePublicUrl,
  getEvidenceSignedUrl,
  uploadEvidenceFiles,
  listEvidenceByFollowup,
  deleteEvidence,
} from './evidence';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('evidence API', () => {
  it('getEvidencePublicUrl returns null for falsy path', () => {
    expect(getEvidencePublicUrl(null)).toBeNull();
  });

  it('getEvidencePublicUrl returns public url when present', async () => {
    const sup = await import('./supabaseClient') as any;
    sup.__setMocks(
      (bucket: string) => ({ getPublicUrl: () => ({ data: { publicUrl: 'https://pub' } }) }),
      () => ({}),
    );
    expect(getEvidencePublicUrl('p')).toBe('https://pub');
  });

  it('getEvidenceSignedUrl returns public url when available', async () => {
    const sup = await import('./supabaseClient') as any;
    sup.__setMocks(
      (bucket: string) => ({ getPublicUrl: () => ({ data: { publicUrl: 'https://pub' } }) }),
      () => ({}),
    );
    const url = await getEvidenceSignedUrl('p');
    expect(url).toBe('https://pub');
  });

  it('getEvidenceSignedUrl falls back to signed url when public missing', async () => {
    const sup = await import('./supabaseClient') as any;
    sup.__setMocks(
      (bucket: string) => ({ getPublicUrl: () => ({ data: { publicUrl: null } }) }),
      () => ({}),
    );
    // Ensure createSignedUrl is present on the storage mock
    sup.__setMocks(
      (bucket: string) => ({ createSignedUrl: async () => ({ data: { signedUrl: 'https://signed' } }), getPublicUrl: () => ({ data: { publicUrl: null } }) }),
      () => ({}),
    );
    const url = await getEvidenceSignedUrl('path');
    expect(url).toBe('https://signed');
  });

  it('uploadEvidenceFiles throws when followupId missing', async () => {
    await expect(uploadEvidenceFiles({ caseId: 1, followupId: null, files: [] })).rejects.toThrow();
  });

  it('uploadEvidenceFiles throws for invalid file types', async () => {
    await expect(
      uploadEvidenceFiles({ followupId: 1, files: [{ name: 'x.exe', type: 'application/x-exe', size: 10 }] as any }),
    ).rejects.toThrow('Solo se permiten imágenes y PDFs');
  });

  it('uploadEvidenceFiles uploads and inserts rows on success', async () => {
    const sup = await import('./supabaseClient') as any;
    sup.__setMocks(
      (bucket: string) => ({ upload: async () => ({ error: null }), remove: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: null } }) }),
      (table: string) => {
        if (table === 'case_followups') {
          return { select: () => ({ eq: () => ({ single: async () => ({ data: { case_id: 99 }, error: null }) }) }) };
        }
        if (table === 'followup_evidence') {
          return { insert: () => ({ select: () => ({ single: async () => ({ data: { id: 5, storage_path: 'cases/99' }, error: null }) }) }) };
        }
        return {} as any;
      },
    );

    const files = [{ name: 'img.png', type: 'image/png', size: 1024 }];
    const res = await uploadEvidenceFiles({ followupId: 7, files: files as any });
    expect(Array.isArray(res)).toBe(true);
    expect(res[0]).toHaveProperty('id');
  });

  it('listEvidenceByFollowup returns rows', async () => {
    // Mock withRetry chain for select
    const fakeRows = [{ id: 1 }];
    const chain = { select: () => ({ eq: () => ({ order: async () => ({ data: fakeRows, error: null }) }) }) } as any;
    const sup = await import('./supabaseClient') as any;
    sup.__setMocks(() => ({}), () => chain as any);
    const rows = await listEvidenceByFollowup(3);
    expect(rows).toEqual(fakeRows);
  });

  it('deleteEvidence removes storage and deletes DB row', async () => {
    const sup = await import('./supabaseClient') as any;
    sup.__setMocks(
      (bucket: string) => ({ remove: async () => ({ error: null }) }),
      () => ({ delete: () => ({ eq: async () => ({ error: null }) }) }),
    );
    await expect(deleteEvidence({ id: 1, storage_path: 'p' })).resolves.toBeUndefined();
  });
});

