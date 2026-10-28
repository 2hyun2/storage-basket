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
import { createClient } from '@/lib/supabase/client'

const initialState: AuthState = {}
const LAST_LOGIN_EMAIL_KEY = 'storage-basket:last-login-email:v1'

type AuthFormProps = {
  mode: 'login' | 'signup'
  nextPath?: string
}

type InvitePreview = {
  home_name: string
  owner_name: string
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
  const [inviteCode, setInviteCode] = useState('')
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [isCheckingInvite, setIsCheckingInvite] = useState(false)
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

  async function checkInviteCode() {
    const normalizedCode = inviteCode.trim().toUpperCase()
    if (!normalizedCode) {
      setInvitePreview(null)
      setInviteMessage('초대 코드를 입력해 주세요.')
      return
    }

    setIsCheckingInvite(true)
    setInviteMessage(null)
    const { data, error } = await createClient()
      .rpc('preview_home_invite', { invite_code_input: normalizedCode })
      .maybeSingle<InvitePreview>()

    setIsCheckingInvite(false)
    if (error || !data) {
      setInvitePreview(null)
      setInviteMessage('코드를 찾지 못했습니다. 공동체 대표에게 다시 확인해 주세요.')
      return
    }

    setInviteCode(normalizedCode)
    setInvitePreview(data)
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-3">
      <input type="hidden" name="next" value={nextPath ?? ''} />
      {!isLogin && (
        <>
          <Field
            label="이름"
            name="displayName"
            placeholder="표시할 이름"
            autoComplete="name"
          />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">초대 코드가 있으신가요?</span>
              <span className="block text-xs leading-5 text-slate-500">코드를 확인하면 새 개인 공간 대신 기존 공동체에 바로 참여합니다.</span>
              <span className="mt-2 flex gap-2">
                <input
                  name="inviteCode"
                  value={inviteCode}
                  onChange={(event) => {
                    setInviteCode(event.target.value.toUpperCase())
                    setInvitePreview(null)
                    setInviteMessage(null)
                  }}
                  placeholder="예: A1B2C3D4"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold tracking-[0.12em] outline-none focus:border-violet-500"
                />
                <button type="button" onClick={() => void checkInviteCode()} disabled={isCheckingInvite} className="shrink-0 rounded-xl border border-violet-200 bg-white px-3 text-sm font-extrabold text-violet-700 hover:bg-violet-50 disabled:opacity-60">
                  {isCheckingInvite ? '확인 중' : '코드 확인'}
                </button>
              </span>
            </label>
            {invitePreview && (
              <div className="mt-3 rounded-xl bg-violet-100 px-3 py-2 text-sm text-violet-950">
                <strong>{invitePreview.home_name}</strong>
                <span className="ml-1">· 대표 {invitePreview.owner_name}</span>
                <p className="mt-1 text-xs text-violet-700">이 공동체에 참여한 뒤 공간과 물건을 함께 볼 수 있어요.</p>
              </div>
            )}
            {inviteMessage && <p className="mt-2 text-xs font-bold text-rose-700">{inviteMessage}</p>}
          </div>
        </>
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
        <div className="space-y-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
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
        {pending ? '처리 중…' : isLogin ? '로그인' : '우리집 공간록 만들기'}
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
