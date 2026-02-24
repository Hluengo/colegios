import { test, expect } from '@playwright/test';

test('homepage loads and has correct title', async ({ page, baseURL }) => {
  // Ensure dev server is running at baseURL (default http://localhost:5173)
  await page.goto('/');

  // Check title
  await expect(page).toHaveTitle(/Convivencia Escolar/);

  // Root element exists
  const root = await page.locator('#root');
  await expect(root).toHaveCount(1);
});
