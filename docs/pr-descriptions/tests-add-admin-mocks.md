# Changes in this PR

- Added focused unit checks for `src/api/db.ts` helper functions.
- Added basic export checks for `src/api/admin.ts` helpers.
- Added behavior tests with mocked `supabase` for `uploadTenantBrandAsset`, `inviteTenantUser`, and `onboardCollege`.

These tests are designed to be non-destructive and mock external Supabase interactions so they run quickly in CI.
