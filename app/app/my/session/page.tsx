import Link from 'next/link'
import { ArrowLeft, Laptop, ShieldCheck } from 'lucide-react'
import { cookies } from 'next/headers'
import { SessionPreferenceForm } from '@/components/session-preference-form'
import { REMEMBER_SESSION_COOKIE } from '@/lib/auth/session'

type SessionPageProps = {
  searchParams: Promise<{ updated?: string; error?: string }>
}

export default async function SessionPage({ searchParams }: SessionPageProps) {
  const cookieStore = await cookies()
  const persistSession = cookieStore.get(REMEMBER_SESSION_COOKIE)?.value === '1'
  const { updated, error } = await searchParams

  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-4 py-6 text-slate-950 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-xl">
        <Link href="/app/my" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          마이페이지로 돌아가기
        </Link>

        <div className="mt-6 rounded-3xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
            <ShieldCheck size={21} />
          </span>
          <p className="mt-6 text-sm font-bold text-violet-600">로그인 및 보안</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">로그인 상태</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            이 기기에서 브라우저를 닫은 뒤에도 로그인 상태를 유지할지 선택합니다.
          </p>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Laptop size={17} className="text-violet-700" />
              현재 사용 중인 기기
            </span>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              다른 기기에 로그인된 세션 목록과 전체 로그아웃은 다음 단계에서 추가합니다.
            </p>
          </div>

          <SessionPreferenceForm
            persistSession={persistSession}
            updated={Boolean(updated)}
            error={Boolean(error)}
          />
        </div>
      </section>
    </main>
  )
}
