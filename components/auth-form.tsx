'use client'

import Link from 'next/link'
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEventHandler,
  type Ref,
} from 'react'
import { login, signup, type AuthState } from '@/app/(auth)/actions'

const initialState: AuthState = {}
const LAST_LOGIN_EMAIL_KEY = 'storage-basket:last-login-email:v1'

type AuthFormProps = {
  mode: 'login' | 'signup'
  nextPath?: string
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const action = mode === 'login' ? login : signup
  const [state, formAction, pending] = useActionState(action, initialState)
  const isLogin = mode === 'login'
  const storedEmail = useSyncExternalStore(
    subscribeToSavedLoginEmail,
    getSavedLoginEmail,
    getSavedLoginEmailServerSnapshot,
  )
  const [editedEmail, setEditedEmail] = useState<string | null>(null)
  const [rememberEmailChoice, setRememberEmailChoice] = useState<boolean | null>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const email = editedEmail ?? (isLogin ? storedEmail : '')
  const rememberEmail = rememberEmailChoice ?? Boolean(storedEmail)

  useEffect(() => {
    if (isLogin && state.error) {
      passwordInputRef.current?.focus()

      if (passwordInputRef.current) {
        passwordInputRef.current.value = ''
      }
    }
  }, [isLogin, state.error])

  function handleSubmit(formData: FormData) {
    if (isLogin) {
      const submittedEmail = String(formData.get('email') ?? '').trim()
      const shouldRememberEmail = formData.get('rememberEmail') === 'on'

      if (shouldRememberEmail && submittedEmail) {
        window.localStorage.setItem(LAST_LOGIN_EMAIL_KEY, submittedEmail)
      } else {
        window.localStorage.removeItem(LAST_LOGIN_EMAIL_KEY)
      }

      setEditedEmail(submittedEmail)
    }

    formAction(formData)
  }

  return (
    <form action={handleSubmit} className="mt-7 space-y-4">
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
        value={email}
        onChange={(event) => setEditedEmail(event.target.value)}
      />
      <Field
        label="비밀번호"
        name="password"
        placeholder={isLogin ? '비밀번호 입력' : '8자 이상 입력'}
        type="password"
        autoComplete={isLogin ? 'current-password' : 'new-password'}
        inputRef={passwordInputRef}
      />
      {isLogin && (
        <div className="space-y-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <CheckField
            name="rememberEmail"
            checked={rememberEmail}
            onChange={(checked) => setRememberEmailChoice(checked)}
            label="이메일 기억"
            description="이 기기에 이메일 주소만 저장합니다."
          />
          <CheckField
            name="rememberSession"
            label="로그인 상태 유지"
            description="브라우저를 다시 열어도 로그인 상태를 유지합니다."
          />
        </div>
      )}
      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-2 py-2 text-sm font-medium text-rose-600"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-xl bg-emerald-50 px-2 py-2 text-sm font-medium leading-6 text-emerald-700">
          {state.message}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-2xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
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

type CheckFieldProps = {
  name: string
  label: string
  description: string
  checked?: boolean
  onChange?: (checked: boolean) => void
}

function CheckField({ name, label, description, checked, onChange }: CheckFieldProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-0.5 size-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
      />
      <span>
        <span className="block font-bold text-slate-700">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </label>
  )
}

function subscribeToSavedLoginEmail(listener: () => void) {
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener('storage', listener)
  }
}

function getSavedLoginEmail() {
  return window.localStorage.getItem(LAST_LOGIN_EMAIL_KEY) ?? ''
}

function getSavedLoginEmailServerSnapshot() {
  return ''
}

type FieldProps = {
  label: string
  name: string
  placeholder: string
  type?: string
  autoComplete: string
  value?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  inputRef?: Ref<HTMLInputElement>
}

function Field({
  label,
  name,
  placeholder,
  type = 'text',
  autoComplete,
  value,
  onChange,
  inputRef,
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
        value={value}
        onChange={onChange}
        ref={inputRef}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  )
}
