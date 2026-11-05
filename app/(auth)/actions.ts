'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { appDestination, GOOGLE_LOGIN_DESTINATION_COOKIE } from '@/lib/auth/destination'
import { REMEMBER_SESSION_COOKIE, REMEMBER_SESSION_MAX_AGE } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error?: string }

const sessionPreferenceSchema = z.object({
  sessionPreference: z.enum(['session', 'persistent']),
})

export async function signInWithGoogle(_: AuthState, formData: FormData): Promise<AuthState> {
  const destination = appDestination(formData.get('next'))
  let authorizationUrl: string

  try {
    const siteUrl = process.env.AUTH_SITE_URL ??
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://storage-basket.vercel.app')
    const callback = new URL('/auth/callback', siteUrl)

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.href },
    })

    if (error || !data.url) return { error: 'Google 로그인에 연결하지 못했어요. 다시 시도해 주세요.' }
    const cookieStore = await cookies()
    cookieStore.set(GOOGLE_LOGIN_DESTINATION_COOKIE, destination, {
      path: '/auth/callback',
      httpOnly: true,
      sameSite: 'lax',
      secure: callback.protocol === 'https:',
      maxAge: 10 * 60,
    })
    authorizationUrl = data.url
  } catch {
    return { error: 'Google 로그인에 연결하지 못했어요. 다시 시도해 주세요.' }
  }

  redirect(authorizationUrl)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete(REMEMBER_SESSION_COOKIE)
  redirect('/login')
}

export async function updateSessionPreference(formData: FormData) {
  const parsed = sessionPreferenceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect('/app/my/session?error=invalid')

  const persistSession = parsed.data.sessionPreference === 'persistent'
  const supabase = await createClient({ persistSession })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase.auth.refreshSession()
  if (error) {
    redirect('/app/my/session?error=refresh')
  }

  const cookieStore = await cookies()

  if (persistSession) {
    cookieStore.set(REMEMBER_SESSION_COOKIE, '1', {
      path: '/',
      sameSite: 'lax',
      maxAge: REMEMBER_SESSION_MAX_AGE,
    })
  } else {
    cookieStore.delete(REMEMBER_SESSION_COOKIE)
  }

  redirect('/app/my/session?updated=1')
}
