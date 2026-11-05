import { NextResponse, type NextRequest } from 'next/server'
import { appDestination, GOOGLE_LOGIN_DESTINATION_COOKIE } from '@/lib/auth/destination'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const destination = appDestination(request.cookies.get(GOOGLE_LOGIN_DESTINATION_COOKIE)?.value)
  const retry = new URL('/login', request.url)
  retry.searchParams.set('error', 'google')
  retry.searchParams.set('next', destination)

  let target = retry
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) target = new URL(destination, request.url)
  }

  const response = NextResponse.redirect(target)
  response.cookies.set(GOOGLE_LOGIN_DESTINATION_COOKIE, '', { path: '/auth/callback', maxAge: 0 })
  return response
}
