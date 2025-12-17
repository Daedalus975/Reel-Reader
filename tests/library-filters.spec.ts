import { test, expect } from '@playwright/test'

const clearState = async (page: any) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.addStyleTag({ content: 'header, aside { pointer-events: none !important; }' })
}

test('library filters: type, genre, favorites, adult', async ({ page }) => {
  await clearState(page)

  // Library baseline
  await page.goto('/library')
  await page.addStyleTag({ content: 'header, aside { pointer-events: none !important; }' })
  await expect(page.getByText('Piku')).toBeVisible()

  // Type filter to Movies
  await page.getByRole('button', { name: /movies/i }).click()
  await expect(page.getByText('Piku')).toBeVisible()
  await expect(page.getByText('Tamasha')).toBeVisible()

  // Genre filter to Romance (should keep Tamasha, hide Piku)
  await page.getByLabel('Genre').selectOption('Romance')
  await expect(page.getByText('Tamasha')).toBeVisible()
  await expect(page.getByText('Piku')).not.toBeVisible()

  // Mark Piku as favorite via detail page
  await page.goto('/detail/1')
  await page.getByRole('button', { name: /favorite|unfavorite/i }).click()

  // Back to library and filter favorites only
  await page.goto('/library')
  await page.addStyleTag({ content: 'header, aside { pointer-events: none !important; }' })
  await page.getByLabel(/Favorites only/i).check()
  await expect(page.getByText('Piku')).toBeVisible()
  await expect(page.getByText('Tamasha')).not.toBeVisible()

  // Hide adult content toggle should not remove items (no adult items seeded)
  await page.getByLabel(/Hide adult content/i).check()
  await expect(page.getByText('Piku')).toBeVisible()
})
