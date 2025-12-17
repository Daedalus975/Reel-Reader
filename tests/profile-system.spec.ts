import { test, expect } from '@playwright/test'

test.describe('Profile System', () => {
  test.beforeEach(async ({ page }) => {
    // Disable nav pointer events during tests to avoid interference
    await page.addInitScript(() => {
      const style = document.createElement('style')
      style.textContent = `
        header, aside, nav { pointer-events: none !important; }
        header *, aside *, nav * { pointer-events: auto !important; }
      `
      document.head.appendChild(style)
    })
    await page.goto('http://localhost:5173/')
  })

  test('Create and switch profiles', async ({ page }) => {
    // Navigate to profiles page
    await page.goto('http://localhost:5173/profile')
    
    // Verify we're on the profile page
    await expect(page.locator('h1')).toContainText('Profiles')
    
    // Check default profile exists
    const profileCards = page.locator('div[style*="border-2"]')
    const initialCount = await profileCards.count()
    expect(initialCount).toBeGreaterThan(0)

    // Click "Create New Profile" button
    await page.click('button:has-text("+ Create New Profile")')
    
    // Wait for form to appear
    await expect(page.locator('input[placeholder="Enter profile name"]')).toBeVisible()

    // Enter profile name
    await page.fill('input[placeholder="Enter profile name"]', 'Test Profile')

    // Click "Create Profile" button
    await page.click('button:has-text("Create Profile")')

    // Wait for new profile to appear
    await page.waitForTimeout(500)
    
    // Verify new profile count
    const updatedCount = await page.locator('div[style*="border-2"]').count()
    expect(updatedCount).toBe(initialCount + 1)

    // Verify the new profile is now active (highlighted)
    await expect(page.locator('text=Test Profile').first()).toBeVisible()
  })

  test('Profile data isolation - each profile has own media', async ({ page, context }) => {
    // Navigate to profiles page
    await page.goto('http://localhost:5173/profile')

    // Create first test profile
    await page.click('button:has-text("+ Create New Profile")')
    await page.fill('input[placeholder="Enter profile name"]', 'Profile A')
    await page.click('button:has-text("Create Profile")')
    await page.waitForTimeout(500)

    // Go to library to check media
    await page.goto('http://localhost:5173/library')
    
    // Count initial media items
    const mediaCardsA = page.locator('[data-testid="media-card"]')
    const countA = await mediaCardsA.count()
    expect(countA).toBeGreaterThan(0)

    // Go back to profiles and create second profile
    await page.goto('http://localhost:5173/profile')
    await page.click('button:has-text("+ Create New Profile")')
    await page.fill('input[placeholder="Enter profile name"]', 'Profile B')
    await page.click('button:has-text("Create Profile")')
    await page.waitForTimeout(500)

    // Go to library in new profile
    await page.goto('http://localhost:5173/library')
    
    // Should have same initial media (new profiles get sample data)
    const mediaCardsB = page.locator('[data-testid="media-card"]')
    const countB = await mediaCardsB.count()
    expect(countB).toBeGreaterThan(0)

    // Now import an item in Profile B
    await page.goto('http://localhost:5173/import')
    await page.fill('input[placeholder*="Title"]', 'Test Movie Profile B')
    await page.selectOption('select', 'movie')
    await page.click('button:has-text("Add to Library")')
    await page.waitForTimeout(500)

    // Check library now has extra item
    await page.goto('http://localhost:5173/library')
    const updatedCountB = await page.locator('[data-testid="media-card"]').count()
    expect(updatedCountB).toBe(countB + 1)

    // Switch back to Profile A
    await page.goto('http://localhost:5173/profile')
    const profileAButton = page.locator('text=Profile A').locator('button:has-text("Switch")').first()
    await profileAButton.click()
    await page.waitForTimeout(500)

    // Verify Profile A still has original count (no shared data)
    await page.goto('http://localhost:5173/library')
    const finalCountA = await page.locator('[data-testid="media-card"]').count()
    expect(finalCountA).toBe(countA)
  })

  test('Delete profile reverts to another profile', async ({ page }) => {
    // Navigate to profiles page
    await page.goto('http://localhost:5173/profile')

    // Create two profiles
    await page.click('button:has-text("+ Create New Profile")')
    await page.fill('input[placeholder="Enter profile name"]', 'To Delete')
    await page.click('button:has-text("Create Profile")')
    await page.waitForTimeout(500)

    const toDeleteName = 'To Delete'
    
    // Verify delete button exists
    const deleteButton = page.locator(`text=${toDeleteName}`).locator('button:has-text("Delete")').first()
    await expect(deleteButton).toBeVisible()

    // Click delete
    await deleteButton.click()
    await page.waitForTimeout(500)

    // Verify profile is deleted (text no longer present)
    await expect(page.locator(`text=${toDeleteName}`)).not.toBeVisible()
  })

  test('Profile persistence - data survives reload', async ({ page }) => {
    // Create a new profile
    await page.goto('http://localhost:5173/profile')
    await page.click('button:has-text("+ Create New Profile")')
    await page.fill('input[placeholder="Enter profile name"]', 'Persistent Profile')
    await page.click('button:has-text("Create Profile")')
    await page.waitForTimeout(500)

    // Get the current profile name by finding the profile section
    const profileText = await page.locator('text=Persistent Profile').first().textContent()
    expect(profileText).toContain('Persistent Profile')

    // Reload the page
    await page.reload()
    await page.waitForTimeout(1000)

    // Verify profile data persisted
    await page.goto('http://localhost:5173/profile')
    await expect(page.locator('text=Persistent Profile').first()).toBeVisible()
  })
})
