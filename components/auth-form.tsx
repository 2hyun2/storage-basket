'use client'

import { useActionState } from 'react'
import { signInWithGoogle, type AuthState } from '@/app/(auth)/actions'

const initialState: AuthState = {}

export function AuthForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(signInWithGoogle, initialState)

  return (
    <form action={action} className="mt-4 space-y-3">
      <input type="hidden" name="next" value={nextPath} />
      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? 'Google에 연결 중…' : 'Google 계정으로 계속하기'}
      </button>
    </form>
  )
}
