'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { updateSessionPreference } from '@/app/(auth)/actions'

type SessionPreference = 'session' | 'persistent'

type SessionPreferenceFormProps = {
  persistSession: boolean
  updated: boolean
  error: boolean
}

export function SessionPreferenceForm({ persistSession, updated, error }: SessionPreferenceFormProps) {
  const [preference, setPreference] = useState<SessionPreference>(persistSession ? 'persistent' : 'session')

  return (
    <form action={updateSessionPreference} className="mt-5">
      <div className="space-y-3">
        <SessionChoice
          checked={preference === 'session'}
          value="session"
          title="브라우저를 닫으면 로그아웃"
          description="공용 기기에서 권장되는 설정입니다."
          onChange={setPreference}
        />
        <SessionChoice
          checked={preference === 'persistent'}
          value="persistent"
          title="로그인 상태 유지"
          description="다음에 브라우저를 열어도 로그인 상태를 유지합니다."
          onChange={setPreference}
        />
      </div>

      {updated && (
        <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700">
          로그인 상태 설정을 저장했습니다.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
          로그인 상태를 변경하지 못했습니다. 다시 로그인한 뒤 시도해 주세요.
        </p>
      )}

      <button className="mt-6 w-full rounded-2xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">
        로그인 상태 저장
      </button>
    </form>
  )
}

type SessionChoiceProps = {
  checked: boolean
  value: SessionPreference
  title: string
  description: string
  onChange: (value: SessionPreference) => void
}

function SessionChoice({ checked, value, title, description, onChange }: SessionChoiceProps) {
  return (
    <label className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition ${checked ? 'border-violet-500 bg-violet-50 ring-4 ring-violet-100' : 'border-slate-200 bg-white hover:border-violet-200'}`}>
      <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${checked ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white'}`}>
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <span>
        <strong className="block text-sm text-slate-800">{title}</strong>
        <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
      </span>
      <input
        className="sr-only"
        type="radio"
        name="sessionPreference"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
    </label>
  )
}
