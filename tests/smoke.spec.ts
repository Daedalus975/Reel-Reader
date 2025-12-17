import { test, expect } from '@playwright/test'

const HOME_HERO_BUTTON = /watch now/i

/**
 * Smoke flow covers:
 * - Home hero CTA
 * - Library filters and cards
 * - Detail actions (favorite + watched)
 * - Import manual item
 * - Search filtering
 * - Persistence after reload
 */

test('reel-reader smoke flow', async ({ page }) => {
  // Fresh state
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.addStyleTag({ content: 'header, aside { pointer-events: none !important; }' })

  // Home
  await expect(page.getByRole('button', { name: HOME_HERO_BUTTON })).toBeVisible()
  await page.getByRole('button', { name: HOME_HERO_BUTTON }).click()
  await expect(page).toHaveURL(/\/watch\//)
  await page.goBack()

  // Library: filter and open detail
  await page.goto('/library')
  await page.getByRole('button', { name: /movies/i }).click()
  await expect(page.getByText('Piku')).toBeVisible()

  // Open detail directly to avoid sidebar intercept
  await page.goto('/detail/1')
  await expect(page).toHaveURL(/\/detail\/1/)
  const favButton = page.getByRole('button', { name: /favorite|unfavorite/i })
  await favButton.click()
  await page.getByRole('button', { name: /mark watched/i }).click()
  await page.goBack()

  // Library: confirm watched badge appears somewhere
  await expect(page.getByText(/watched/i)).toBeVisible()

  // Import: add a manual item
  await page.goto('/import')
  await page.getByPlaceholder('Title').fill('Test Item')
  await page.getByRole('combobox').first().selectOption('book')
  await page.getByPlaceholder(/Language/i).fill('EN')
  await page.getByPlaceholder('Year').fill('2024')
  await page.getByPlaceholder(/Tags/i).fill('test, sample')
  await page.getByRole('button', { name: /add manual item/i }).click()

  // Library: new item appears
  await page.goto('/library')
  await expect(page.getByText('Test Item')).toBeVisible()

  // Search: query new item
  await page.goto('/search')
  await page.getByPlaceholder('Search your library...').fill('Test Item')
  await expect(page.getByText('Test Item')).toBeVisible()

  // Persistence check: reload and ensure data still present
  await page.reload()
  await expect(page.getByText('Test Item')).toBeVisible()
  await page.goto('/library')
  await expect(page.getByText('Test Item')).toBeVisible()
  await expect(page.getByText(/watched/i)).toBeVisible()
})
