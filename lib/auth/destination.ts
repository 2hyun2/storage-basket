const appOrigin = 'https://storage-basket.invalid'

export const GOOGLE_LOGIN_DESTINATION_COOKIE = 'storage-basket-google-destination'

export function appDestination(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/app'
  }

  const url = new URL(value, appOrigin)
  if (url.origin !== appOrigin || (url.pathname !== '/app' && !url.pathname.startsWith('/app/'))) {
    return '/app'
  }

  return url.pathname + url.search + url.hash
}
