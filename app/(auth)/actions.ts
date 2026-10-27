'use server'

import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { z } from 'zod'
import { REMEMBER_SESSION_COOKIE, REMEMBER_SESSION_MAX_AGE } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error?: string; message?: string }
export type PasswordChangeState = { error?: string; message?: string }

const loginSchema = z.object({
  email: z.email('이메일 형식을 확인해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
  next: z.string().optional(),
  rememberSession: z.enum(['on']).optional(),
})

const signupSchema = loginSchema.extend({
  displayName: z.string().trim().min(2, '이름은 2자 이상 입력해 주세요.').max(30, '이름은 30자 이하로 입력해 주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상 입력해 주세요.').max(72, '비밀번호는 72자 이하로 입력해 주세요.'),
})

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요.'),
  newPassword: z.string().min(8, '새 비밀번호는 8자 이상 입력해 주세요.').max(72, '새 비밀번호는 72자 이하로 입력해 주세요.'),
  confirmPassword: z.string().min(1, '새 비밀번호 확인을 입력해 주세요.'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '새 비밀번호가 서로 다릅니다.',
  path: ['confirmPassword'],
})

const sessionPreferenceSchema = z.object({
  sessionPreference: z.enum(['session', 'persistent']),
})

function safeNext(value: string | undefined) {
  return value?.startsWith('/app') ? value : '/app'
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.' }

  try {
    const persistSession = parsed.data.rememberSession === 'on'
    const supabase = await createClient({ persistSession })
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })
    if (error) return { error: '이메일 또는 비밀번호를 확인해 주세요.' }

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
  } catch {
    return { error: 'Supabase 연결 설정을 먼저 완료해 주세요.' }
  }

  redirect(safeNext(parsed.data.next))
}

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.' }

  try {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: `${origin ?? 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) return { error: error.message }
    if (!data.session) return { message: '인증 메일을 보냈어요. 메일 안의 링크를 열어 가입을 완료해 주세요.' }
  } catch {
    return { error: 'Supabase 연결 설정을 먼저 완료해 주세요.' }
  }

  redirect('/app')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete(REMEMBER_SESSION_COOKIE)
  redirect('/login')
}

export async function changePassword(_: PasswordChangeState, formData: FormData): Promise<PasswordChangeState> {
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.' }

  const cookieStore = await cookies()
  const persistSession = cookieStore.get(REMEMBER_SESSION_COOKIE)?.value === '1'
  const supabase = await createClient({ persistSession })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return { error: '로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요.' }
  }

  const { error: verificationError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  })

  if (verificationError) {
    return { error: '현재 비밀번호를 확인해 주세요.' }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })

  if (updateError) {
    return { error: '비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
  }

  return { message: '비밀번호를 변경했습니다.' }
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
