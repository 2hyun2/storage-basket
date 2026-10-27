export const REMEMBER_SESSION_COOKIE = 'storage-basket:remember-session'
export const REMEMBER_SESSION_MAX_AGE = 400 * 24 * 60 * 60

export function sessionCookieOptions<T extends { maxAge?: number; expires?: Date }>(
  options: T,
  persistSession: boolean,
) {
  if (persistSession) {
    return options
  }

  const sessionOnlyOptions = { ...options }
  delete sessionOnlyOptions.maxAge
  delete sessionOnlyOptions.expires

  return sessionOnlyOptions
}
