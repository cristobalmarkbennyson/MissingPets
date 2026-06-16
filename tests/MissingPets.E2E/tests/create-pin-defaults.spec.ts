import { expect, test } from '@playwright/test'

const petPhoto = {
  name: 'seeded-pin.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64',
  ),
}

async function selectManualLocation(page: import('@playwright/test').Page, location: string) {
  await page.getByLabel('Manual location').fill(location)
  await page.getByRole('button', { name: 'Use manual location' }).click()
  await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeHidden()
}

async function fillRequiredCreateFields(page: import('@playwright/test').Page, petName: string) {
  await page.getByLabel('Choose pet photos').setInputFiles(petPhoto)
  await page.getByLabel('Pet name').fill(petName)
  await page.getByLabel('Pet type').selectOption('Dog')
  await page.getByLabel('Defining features').fill('Small dog with white paws and a green bandana.')
}

test('manual location seeds create last-seen pin and still requires confirmation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeVisible()
  await selectManualLocation(page, 'BGC, Taguig')

  await page.getByRole('button', { name: 'Post missing pet' }).click()

  await expect(page.getByText('Selected pin: BGC, Taguig. Confirm this pin before publishing.')).toBeVisible()
  await page.getByRole('button', { name: 'Publish post' }).click()
  await expect(page.getByText('Confirm the last-seen pin before publishing.')).toBeVisible()
})

test('browser location seeds create last-seen pin with granted coordinates', async ({ browser }) => {
  const context = await browser.newContext({
    geolocation: { latitude: 14.5503, longitude: 121.0503 },
  })
  await context.grantPermissions(['geolocation'], { origin: 'http://127.0.0.1:5173' })
  const page = await context.newPage()

  try {
    await page.goto('http://127.0.0.1:5173/')
    await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeVisible()
    await page.getByRole('button', { name: 'Allow location' }).click()
    await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeHidden()
    await expect(page.getByLabel('Search location')).toHaveValue('Current location near 14.55030, 121.05030')

    await page.getByRole('button', { name: 'Post missing pet' }).click()

    await expect(page.getByText('Selected pin: Current location near 14.55030, 121.05030. Confirm this pin before publishing.')).toBeVisible()
  } finally {
    await context.close()
  }
})

test('confirming seeded manual pin submits active user location without search or reset', async ({ page }) => {
  const createPostPayloads: unknown[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/posts')) {
      createPostPayloads.push(request.postDataJSON())
    }
  })

  await page.goto('/')
  await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeVisible()
  await selectManualLocation(page, 'BGC, Taguig')

  await page.getByRole('button', { name: 'Post missing pet' }).click()
  await fillRequiredCreateFields(page, 'Seeded BGC Luna')
  await page.getByRole('button', { name: 'Confirm last-seen location' }).click()
  await expect(page.getByText('Confirmed last-seen location: BGC, Taguig.')).toBeVisible()

  await page.getByRole('button', { name: 'Publish post' }).click()
  await expect(page.getByText('Published. Private management link:')).toBeVisible()

  expect(createPostPayloads).toHaveLength(1)
  expect(createPostPayloads[0]).toMatchObject({
    lastSeen: { lat: 14.5503, lng: 121.0503, humanReadable: 'BGC, Taguig' },
  })
})

test('touched last-seen pin is not overwritten by later active location changes', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeVisible()
  await selectManualLocation(page, 'Quezon City')

  await page.getByRole('button', { name: 'Post missing pet' }).click()
  await expect(page.getByText('Selected pin: Quezon City. Confirm this pin before publishing.')).toBeVisible()
  await expect(page.getByText('Google Maps key is not configured.')).toBeVisible()
  await page.getByLabel('Place search').fill('BGC, Taguig')
  await page.getByRole('button', { name: 'Search local fallback' }).click()
  await expect(page.getByText('Selected pin: BGC, Taguig. Confirm this pin before publishing.')).toBeVisible()

  await page.getByRole('button', { name: 'Change location' }).click()
  await selectManualLocation(page, 'Makati, Metro Manila')

  await expect(page.getByText('Selected pin: BGC, Taguig. Confirm this pin before publishing.')).toBeVisible()
})
