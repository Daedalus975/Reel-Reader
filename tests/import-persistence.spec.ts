import { test, expect } from '@playwright/test'

const clearState = async (page: any) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

test('import manual item persists across reload', async ({ page }) => {
  await clearState(page)

  // Import manual item
  await page.goto('/import')
  await page.getByPlaceholder('Title').fill('Persist Item')
  await page.getByRole('combobox').first().selectOption('book')
  await page.getByPlaceholder(/Language/i).fill('EN')
  await page.getByPlaceholder('Year').fill('2024')
  await page.getByPlaceholder(/Tags/i).fill('playwright,test')
  await page.getByRole('button', { name: /add manual item/i }).click()

  // Verify in Library
  await page.goto('/library')
  await expect(page.getByText('Persist Item')).toBeVisible()

  // Reload and verify persistence
  await page.reload()
  await expect(page.getByText('Persist Item')).toBeVisible()

  // Search should find it
  await page.goto('/search')
  await page.getByPlaceholder('Search your library...').fill('Persist Item')
  await expect(page.getByText('Persist Item')).toBeVisible()
})
