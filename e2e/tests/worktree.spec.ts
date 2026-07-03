import { test, expect } from '@playwright/test';

test('homepage loads and displays worktrees', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toHaveText('Git Worktree Manager');
  await expect(page.locator('#status')).toContainText('Loaded');
  await expect(page.locator('#worktree-list li')).toHaveCount(2);
});

test('api health endpoint is reachable', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body).toHaveProperty('status', 'ok');
});
