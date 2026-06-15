import { expect, test } from '@playwright/test'

test('granted browser location updates feed coordinates and uses fallback current-location label', async ({ browser }) => {
  const context = await browser.newContext({
    geolocation: { latitude: 14.5503, longitude: 121.0503 },
  })
  await context.grantPermissions(['geolocation'], { origin: 'http://127.0.0.1:5173' })
  const page = await context.newPage()

  try {
    await page.goto('http://127.0.0.1:5173/')
    await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeVisible()

    const grantedFeedRequest = page.waitForRequest((request) => {
      if (!request.url().includes('/api/posts?')) return false
      const url = new URL(request.url())
      return url.searchParams.get('lat') === '14.5503' && url.searchParams.get('lng') === '121.0503'
    })

    await page.getByRole('button', { name: 'Allow location' }).click()

    await grantedFeedRequest
    await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeHidden()
    await expect(page.getByLabel('Search location')).toHaveValue('Current location near 14.55030, 121.05030')
  } finally {
    await context.close()
  }
})

test('denied browser location keeps manual fallback available', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto('http://127.0.0.1:5173/')
    await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeVisible()

    await page.getByRole('button', { name: 'Allow location' }).click()

    await expect(page.getByText('Location permission was denied. Choose manually to keep browsing.')).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeVisible()

    await page.getByRole('button', { name: 'Use manual location' }).click()

    await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeHidden()
    await expect(page.getByLabel('Search location')).toHaveValue('Makati, Metro Manila')
  } finally {
    await context.close()
  }
})
