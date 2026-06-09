import { expect, test } from '@playwright/test'

test('phase 5 API-backed missing pet journey', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeVisible()
  await page.getByRole('button', { name: 'Use manual location' }).click()
  await expect(page.getByRole('dialog', { name: 'Location permission' })).toBeHidden()

  await page.getByRole('button', { name: 'Post missing pet' }).click()
  await expect(page.getByRole('heading', { name: 'Create missing-pet post' })).toBeVisible()

  await page.getByRole('button', { name: 'Add sample pet photo' }).click()
  await expect(page.getByText('pet-photo-01.jpg')).toBeVisible()

  await page.getByLabel('Pet name').fill('Phase Five Luna')
  await page.getByLabel('Pet type').selectOption('Dog')
  await page.getByLabel('Accessories').fill('Blue harness with small tag')
  await page.getByLabel('Defining features').fill('White paws, tan face, very shy around traffic.')
  await page.getByLabel('Place search').fill('BGC, Taguig')
  await page.getByLabel('Place search').blur()
  await expect(page.getByText('Pin selected for BGC, Taguig.')).toBeVisible()

  await page.getByRole('button', { name: 'Publish post' }).click()
  await expect(page.getByText('Published. Private management link:')).toBeVisible()
  await page.waitForURL(/\/posts\/[0-9a-f-]+$/)

  await expect(page.getByRole('heading', { name: 'Phase Five Luna' })).toBeVisible()
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
})
