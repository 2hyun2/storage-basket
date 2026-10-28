import Link from 'next/link'
import { ArrowLeft, UsersRound } from 'lucide-react'
import { CommunityManager } from '@/components/community/community-manager'

export default function CommunityPage() {
  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-2 py-4 text-slate-950 sm:px-4 sm:py-6">
      <section className="mx-auto max-w-3xl">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          홈
        </Link>
        <header className="mt-6">
          <p className="flex items-center gap-2 text-sm font-bold text-violet-600"><UsersRound size={17} /> 공동체</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">함께 쓰는 공간</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">같은 공동체 구성원은 공간과 물건 기록을 함께 관리합니다.</p>
        </header>
        <div className="mt-5"><CommunityManager /></div>
      </section>
    </main>
  )
}
