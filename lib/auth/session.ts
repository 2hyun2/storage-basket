export const REMEMBER_SESSION_COOKIE = 'storage-basket:remember-session'
export const REMEMBER_SESSION_MAX_AGE = 400 * 24 * 60 * 60

export function sessionCookieOptions<T extends { maxAge?: number; expires?: Date }>(
  options: T,
  persistSession: boolean,
) {
  // 삭제 쿠키의 만료값은 로그아웃 때도 유지한다.
  if (persistSession || options.maxAge === 0 || (options.expires && options.expires.getTime() <= Date.now())) {
    return options
  }

  const sessionOnlyOptions = { ...options }
  delete sessionOnlyOptions.maxAge
  delete sessionOnlyOptions.expires

  return sessionOnlyOptions
}
