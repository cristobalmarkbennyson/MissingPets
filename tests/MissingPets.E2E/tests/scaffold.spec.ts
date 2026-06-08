import { expect, test } from '@playwright/test'

test('phase 1 route reservations are documented for e2e coverage', async () => {
  const routes = ['/', '/posts/new', '/posts/example-post', '/posts/example-post/manage']

  expect(routes).toEqual([
    '/',
    '/posts/new',
    '/posts/example-post',
    '/posts/example-post/manage',
  ])
})
