import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BrandIcon } from '@/components/brand-icon'
import { AuthForm } from '@/components/auth-form'
import { appDestination } from '@/lib/auth/destination'
import { createClient } from '@/lib/supabase/server'

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams
  const destination = appDestination(next)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user && !error) redirect(destination)

  return (
    <section className="w-full max-w-md rounded-xl border border-violet-100 bg-white p-4 shadow-xl shadow-violet-100/70">
      <Link
        href="/"
        aria-label="우리집 공간록 홈"
        className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-600 text-white"
      >
        <BrandIcon size={24} />
      </Link>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">우리집 공간록 시작하기</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Google 계정으로 가입하거나 로그인할 수 있어요.
      </p>
      {error === 'google' && (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-2 text-sm text-rose-700">
          Google 로그인을 완료하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
      <AuthForm nextPath={destination} />
      <p className="mt-4 text-sm leading-6 text-slate-500">
        시작하기 전에 <Link href="/privacy" className="font-semibold text-violet-700 underline">개인정보처리방침</Link>을 확인해 주세요.
      </p>
    </section>
  )
}
