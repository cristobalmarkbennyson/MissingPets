import { expect, test } from '@playwright/test'

const evidenceDir = '../../docs/exec-plans/active'
const petPhoto = {
  name: 'maple.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64',
  ),
}

test('phase 6 captures desktop and mobile browser evidence', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeVisible()
  await page.screenshot({ path: `${evidenceDir}/phase6-feed-location-desktop.png`, fullPage: true })
  await page.getByRole('button', { name: 'Use manual location' }).click()

  await page.getByRole('button', { name: 'Post missing pet' }).click()
  await page.screenshot({ path: `${evidenceDir}/phase6-create-empty-desktop.png`, fullPage: true })
  await page.getByLabel('Choose pet photos').setInputFiles(petPhoto)
  await page.getByLabel('Pet name').fill('Phase Six Maple')
  await page.getByLabel('Pet type').selectOption('Cat')
  await page.getByLabel('Accessories').fill('Green collar')
  await page.getByLabel('Defining features').fill('Orange tabby with white socks and a soft meow.')
  await page.getByRole('button', { name: 'Publish post' }).click()
  await page.waitForURL(/\/posts\/[0-9a-f-]+$/)
  await expect(page.getByRole('heading', { name: 'Phase Six Maple' })).toBeVisible()
  await page.screenshot({ path: `${evidenceDir}/phase6-detail-desktop.png`, fullPage: true })

  await page.getByRole('button', { name: 'Message poster' }).click()
  await expect(page.getByRole('dialog', { name: 'Message poster' })).toBeVisible()
  await page.screenshot({ path: `${evidenceDir}/phase6-message-modal-desktop.png`, fullPage: true })
  await page.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: 'Report post' }).click()
  await expect(page.getByRole('dialog', { name: 'Report abuse' })).toBeVisible()
  await page.screenshot({ path: `${evidenceDir}/phase6-report-modal-desktop.png`, fullPage: true })
  await page.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: 'Manage with private code' }).click()
  await expect(page.getByText('Management token accepted')).toBeVisible()
  await page.screenshot({ path: `${evidenceDir}/phase6-management-desktop.png`, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Use manual location' }).click()
  await page.screenshot({ path: `${evidenceDir}/phase6-feed-mobile.png`, fullPage: true })
  await page.getByRole('button', { name: 'Post missing pet' }).click()
  await page.screenshot({ path: `${evidenceDir}/phase6-create-mobile.png`, fullPage: true })
  await page.goBack()
  await page.getByRole('button', { name: 'Post missing pet' }).click()
  await page.getByLabel('Choose pet photos').setInputFiles({ ...petPhoto, name: 'mobile.png' })
  await page.getByLabel('Pet name').fill('Phase Six Mobile')
  await page.getByLabel('Defining features').fill('Small dog with black ears and a blue leash.')
  await page.getByRole('button', { name: 'Publish post' }).click()
  await page.waitForURL(/\/posts\/[0-9a-f-]+$/)
  await page.screenshot({ path: `${evidenceDir}/phase6-detail-mobile.png`, fullPage: true })
  await page.getByRole('button', { name: 'Message poster' }).click()
  await page.screenshot({ path: `${evidenceDir}/phase6-message-modal-mobile.png`, fullPage: true })
})
