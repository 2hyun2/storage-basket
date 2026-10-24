'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login, signup, type AuthState } from '@/app/(auth)/actions'

const initialState: AuthState = {}

type AuthFormProps = {
  mode: 'login' | 'signup'
  nextPath?: string
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const action = mode === 'login' ? login : signup
  const [state, formAction, pending] = useActionState(action, initialState)
  const isLogin = mode === 'login'

  return (
    <form action={formAction} className="mt-7 space-y-4">
      <input type="hidden" name="next" value={nextPath ?? ''} />
      {!isLogin && (
        <Field
          label="이름"
          name="displayName"
          placeholder="표시할 이름"
          autoComplete="name"
        />
      )}
      <Field
        label="이메일"
        name="email"
        placeholder="name@example.com"
        type="email"
        autoComplete="email"
      />
      <Field
        label="비밀번호"
        name="password"
        placeholder={isLogin ? '비밀번호 입력' : '8자 이상 입력'}
        type="password"
        autoComplete={isLogin ? 'current-password' : 'new-password'}
      />
      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-600"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium leading-6 text-emerald-700">
          {state.message}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? '처리 중…' : isLogin ? '로그인' : '수납바구니 만들기'}
      </button>
      <p className="text-center text-sm text-slate-500">
        {isLogin ? '처음이신가요? ' : '이미 계정이 있나요? '}
        <Link
          href={isLogin ? '/signup' : '/login'}
          className="font-bold text-violet-700 hover:underline"
        >
          {isLogin ? '회원가입' : '로그인'}
        </Link>
      </p>
    </form>
  )
}

type FieldProps = {
  label: string
  name: string
  placeholder: string
  type?: string
  autoComplete: string
}

function Field({
  label,
  name,
  placeholder,
  type = 'text',
  autoComplete,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <input
        required
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  )
}
