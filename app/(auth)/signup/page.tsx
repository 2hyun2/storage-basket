import Link from 'next/link'
import { Archive } from 'lucide-react'
import { AuthForm } from '@/components/auth-form'

export default function SignupPage() {
  return (
    <section className="w-full max-w-md rounded-3xl border border-violet-100 bg-white p-6 shadow-xl shadow-violet-100/70 sm:p-8">
      <Link
        href="/"
        className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-600 font-bold text-white"
      >
        <Archive size={20} strokeWidth={2.5} />
      </Link>
      <p className="mt-6 text-sm font-bold text-violet-600">나만의 정리 공간</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">
        수납바구니 만들기
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        가입하면 기본 Home 하나와 관리자 권한이 자동으로 만들어져요.
      </p>
      <AuthForm mode="signup" />
    </section>
  )
}
