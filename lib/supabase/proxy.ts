import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { REMEMBER_SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session'

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return NextResponse.next({ request })

  const persistSession = request.cookies.get(REMEMBER_SESSION_COOKIE)?.value === '1'
  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, sessionCookieOptions(options, persistSession))
        })
      },
    },
  })

  const { data: claims } = await supabase.auth.getClaims()
  const isAppRoute = request.nextUrl.pathname.startsWith('/app')

  if (isAppRoute && !claims) {
    const redirectUrl = request.nextUrl.clone()
    const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`

    redirectUrl.pathname = '/login'
    redirectUrl.search = ''
    // 3D 수정처럼 쿼리값에 현재 선택 대상을 담는 화면은
    // 로그인 뒤에도 같은 대상에 돌아가야 한다.
    redirectUrl.searchParams.set('next', requestedPath)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
