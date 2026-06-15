import { expect, test } from '@playwright/test'

const petPhoto = {
  name: 'luna.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64',
  ),
}

test('phase 5 API-backed missing pet journey', async ({ page }) => {
  let photoUploadRequests = 0
  const createPostPayloads: unknown[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/photo-uploads')) photoUploadRequests += 1
    if (request.method() === 'POST' && request.url().endsWith('/api/posts')) {
      createPostPayloads.push(request.postDataJSON())
    }
  })

  await page.goto('/')

  await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeVisible()
  await page.getByRole('button', { name: 'Use manual location' }).click()
  await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeHidden()

  await page.getByRole('button', { name: 'Post missing pet' }).click()
  await expect(page.getByRole('heading', { name: 'Create missing-pet post' })).toBeVisible()

  await page.getByLabel('Choose pet photos').setInputFiles(petPhoto)
  await expect(page.getByText('luna.png')).toBeVisible()
  expect(photoUploadRequests).toBe(0)

  await page.getByLabel('Pet name').fill('Phase Five Luna')
  await page.getByLabel('Pet type').selectOption('Dog')
  await page.getByLabel('Accessories').fill('Blue harness with small tag')
  await page.getByLabel('Defining features').fill('White paws, tan face, very shy around traffic.')

  await page.getByRole('button', { name: 'Publish post' }).click()
  await expect(page.getByText('Confirm the last-seen pin before publishing.')).toBeVisible()
  expect(photoUploadRequests).toBe(0)
  expect(createPostPayloads).toHaveLength(0)

  await expect(page.getByText('Google Maps key is not configured.')).toBeVisible()
  await page.getByLabel('Place search').fill('BGC, Taguig')
  await page.getByRole('button', { name: 'Search local fallback' }).click()
  await expect(page.getByText('Selected pin: BGC, Taguig.')).toBeVisible()
  await page.getByRole('button', { name: 'Confirm last-seen location' }).click()
  await expect(page.getByText('Confirmed last-seen location: BGC, Taguig.')).toBeVisible()

  await page.getByRole('button', { name: 'Publish post' }).click()
  await expect(page.getByText('Published. Private management link:')).toBeVisible()
  expect(photoUploadRequests).toBe(1)
  expect(createPostPayloads).toHaveLength(1)
  expect(createPostPayloads[0]).toMatchObject({
    lastSeen: { lat: 14.5503, lng: 121.0503, humanReadable: 'BGC, Taguig' },
  })
  await page.waitForURL(/\/posts\/[0-9a-f-]+$/)

  await expect(page.getByRole('heading', { name: 'Phase Five Luna' })).toBeVisible()
  const detailPhoto = page.getByRole('img', { name: 'Pet photo' }).first()
  await expect(detailPhoto).toHaveAttribute('src', /\/local-photos\//)
  await expect(detailPhoto).toHaveJSProperty('naturalWidth', 1)
  await expect(page.getByText('last seen approx.')).toBeVisible()
  await expect(page.getByText('Exact coordinates are used for search.')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('14.5503')
  await expect(page.locator('body')).not.toContainText('121.0503')

  await page.getByLabel('Add comment').fill('Saw a similar dog near 5th Avenue.')
  await page.getByRole('button', { name: 'Post comment' }).click()
  await expect(page.getByText('Saw a similar dog near 5th Avenue.')).toBeVisible()

  await page.getByRole('button', { name: 'Message poster' }).click()
  const messageDialog = page.getByRole('dialog', { name: 'Message poster' })
  await messageDialog.getByLabel('Your contact info').fill('helper@example.com')
  await messageDialog.getByRole('textbox', { name: 'Message' }).fill('I can share a sighting photo.')
  await messageDialog.getByRole('button', { name: 'Send message' }).click()
  await expect(messageDialog.getByText('Message sent.')).toBeVisible()
  await messageDialog.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: 'Report post' }).click()
  await page.getByLabel('Details').fill('E2E report intake check.')
  await page.getByRole('button', { name: 'Submit report' }).click()
  await expect(page.getByText('Report submitted.')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: 'Manage with private code' }).click()
  await expect(page.getByText('Management token accepted')).toBeVisible()
  await page.getByLabel('Status').selectOption('Found')
  await page.getByRole('button', { name: 'Save status' }).click()
  await expect(page.getByText('Status updated.')).toBeVisible()

  await page.getByRole('button', { name: 'View public post' }).click()
  await expect(page.getByText('Found')).toBeVisible()

  await page.getByRole('button', { name: 'MP MissingPets' }).click()
  await page.getByLabel('Radius').selectOption('25')
  await page.getByLabel('Pet type').selectOption('Dog')
  await page.getByLabel('Status').selectOption('Found')
  await page.getByLabel('Sort').selectOption('Newest')
  await expect(page.getByRole('heading', { name: 'Phase Five Luna' }).first()).toBeVisible()
  const feedPhoto = page.getByRole('img', { name: 'Dog photo' }).first()
  await expect(feedPhoto).toHaveAttribute('src', /\/local-photos\//)
  await expect(feedPhoto).toHaveJSProperty('naturalWidth', 1)
})
