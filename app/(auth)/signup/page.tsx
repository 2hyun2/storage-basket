import Link from 'next/link'
import { Archive } from 'lucide-react'
import { AuthForm } from '@/components/auth-form'

type SignupPageProps = {
  searchParams: Promise<{ invite?: string | string[] }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { invite } = await searchParams
  const initialInviteCode = typeof invite === 'string' ? invite.slice(0, 20) : ''

  return (
    <section className="w-full max-w-md rounded-xl border border-violet-100 bg-white p-3 shadow-xl shadow-violet-100/70 sm:p-4">
      <Link
        href="/"
        className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-600 font-bold text-white"
      >
        <Archive size={20} strokeWidth={2.5} />
      </Link>
      <p className="mt-4 text-sm font-bold text-violet-600">{initialInviteCode ? '공동체 초대' : '나만의 정리 공간'}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
        {initialInviteCode ? '공동체에 참여하기' : '우리집 공간록 만들기'}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        {initialInviteCode
          ? '초대받은 공동체 이름과 대표를 확인한 뒤 참여할 수 있어요.'
          : '가입하면 기본 Home 하나와 관리자 권한이 자동으로 만들어져요.'}
      </p>
      <AuthForm mode="signup" initialInviteCode={initialInviteCode} />
    </section>
  )
}
