import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sessionCookieOptions } from '@/lib/auth/session'

type CreateClientOptions = {
  persistSession?: boolean
}

export async function createClient({ persistSession = true }: CreateClientOptions = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.')
  }

  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, sessionCookieOptions(options, persistSession))
          })
        } catch {
          // Server Component에서 쿠키를 바꿀 수 없는 경우는 proxy가 다음 요청에서 갱신한다.
        }
      },
    },
  })
}
