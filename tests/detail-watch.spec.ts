import { test, expect } from '@playwright/test'

const clearState = async (page: any) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

test('detail and watch actions persist', async ({ page }) => {
  await clearState(page)

  // Open detail for item 1 (Piku)
  await page.goto('/detail/1')
  await expect(page.getByRole('button', { name: /play/i })).toBeVisible()

  // Toggle favorite and mark watched
  const favButton = page.getByRole('button', { name: /favorite|unfavorite/i })
  await favButton.click()
  await page.getByRole('button', { name: /mark watched/i }).click()

  // Go to library and verify watched badge appears
  await page.goto('/library')
  await expect(page.getByText('Watched')).toBeVisible()

  // Reload and ensure persistence
  await page.reload()
  await expect(page.getByText('Watched')).toBeVisible()
  await page.goto('/detail/1')
  await expect(page.getByRole('button', { name: /unfavorite/i })).toBeVisible()
})
