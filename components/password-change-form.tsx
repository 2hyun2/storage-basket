'use client'

import { useActionState } from 'react'
import { changePassword, type PasswordChangeState } from '@/app/(auth)/actions'

const initialState: PasswordChangeState = {}

export function PasswordChangeForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState)

  return (
    <form action={formAction} className="mt-7">
      <div className="space-y-4">
        <PasswordField label="현재 비밀번호" name="currentPassword" placeholder="현재 비밀번호 입력" autoComplete="current-password" />
        <PasswordField label="새 비밀번호" name="newPassword" placeholder="8자 이상 입력" autoComplete="new-password" />
        <PasswordField label="새 비밀번호 확인" name="confirmPassword" placeholder="새 비밀번호 다시 입력" autoComplete="new-password" />
      </div>

      {state.error && (
        <p role="alert" className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700">
          {state.message}
        </p>
      )}

      <button
        disabled={pending}
        className="mt-6 w-full rounded-2xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? '비밀번호 변경 중…' : '비밀번호 변경'}
      </button>
    </form>
  )
}

type PasswordFieldProps = {
  label: string
  name: string
  placeholder: string
  autoComplete: string
}

function PasswordField({ label, name, placeholder, autoComplete }: PasswordFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <input
        required
        name={name}
        type="password"
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  )
}
