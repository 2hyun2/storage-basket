import Link from 'next/link'
import { ArrowLeft, UsersRound } from 'lucide-react'
import { CommunityManager } from '@/components/community/community-manager'

export default function CommunityPage() {
  return (
    <main className="min-h-dvh bg-[#f5f8fd] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-3xl">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          홈
        </Link>
        <header className="mt-4">
          <p className="flex items-center gap-2 text-sm font-bold text-violet-600"><UsersRound size={17} /> 공동체</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-3xl">함께 쓰는 공간</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">같은 공동체 구성원은 공간과 물건 기록을 함께 관리합니다.</p>
        </header>
        <div className="mt-4"><CommunityManager /></div>
      </section>
    </main>
  )
}
