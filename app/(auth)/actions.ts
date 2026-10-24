'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error?: string; message?: string }

const loginSchema = z.object({
  email: z.email('이메일 형식을 확인해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
  next: z.string().optional(),
})

const signupSchema = loginSchema.extend({
  displayName: z.string().trim().min(2, '이름은 2자 이상 입력해 주세요.').max(30, '이름은 30자 이하로 입력해 주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상 입력해 주세요.').max(72, '비밀번호는 72자 이하로 입력해 주세요.'),
})

function safeNext(value: string | undefined) {
  return value?.startsWith('/app') ? value : '/app'
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.' }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })
    if (error) return { error: '이메일 또는 비밀번호를 확인해 주세요.' }
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
