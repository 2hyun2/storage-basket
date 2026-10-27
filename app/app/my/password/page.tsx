import Link from 'next/link'
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react'
import { PasswordChangeForm } from '@/components/password-change-form'

export default function PasswordPage() {
  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-4 py-6 text-slate-950 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-xl">
        <Link href="/app/my" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          마이페이지로 돌아가기
        </Link>

        <div className="mt-6 rounded-3xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
            <KeyRound size={21} />
          </span>
          <p className="mt-6 text-sm font-bold text-violet-600">로그인 및 보안</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">비밀번호 변경</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
          </p>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-sm leading-6 text-violet-900">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-violet-700" />
            <p>현재 비밀번호를 다시 확인한 뒤 Supabase Auth에 새 비밀번호를 저장합니다.</p>
          </div>
          <PasswordChangeForm />
        </div>
      </section>
    </main>
  )
}
