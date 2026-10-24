import Link from 'next/link'
import { Archive } from 'lucide-react'
import { AuthForm } from '@/components/auth-form'

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams

  return (
    <section className="w-full max-w-md rounded-3xl border border-violet-100 bg-white p-6 shadow-xl shadow-violet-100/70 sm:p-8">
      <Link
        href="/"
        className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-600 font-bold text-white"
      >
        <Archive size={20} strokeWidth={2.5} />
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-slate-950">
        로그인
      </h1>
      <AuthForm mode="login" nextPath={next} />
    </section>
  )
}
