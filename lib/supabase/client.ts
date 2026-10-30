import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { REMEMBER_SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.')
  }

  return createBrowserClient(url, key, {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return []
        return parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? '' }))
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        const remember = parseCookieHeader(document.cookie)
          .some(({ name, value }) => name === REMEMBER_SESSION_COOKIE && value === '1')
        for (const { name, value, options } of cookiesToSet) {
          document.cookie = serializeCookieHeader(name, value, sessionCookieOptions(options, remember))
        }
      },
    },
  })
}
