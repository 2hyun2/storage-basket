import Link from 'next/link'
import { ArrowLeft, History } from 'lucide-react'
import { ActivityFeed } from '@/components/activity-feed'

export default function ArchivePage() {
  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-5xl">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition hover:text-violet-700">
          <ArrowLeft size={17} />
          홈
        </Link>
        <div className="mt-6 flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><History size={20} /></span>
          <div>
            <p className="text-sm font-bold text-violet-700">공동체 기록</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.05em]">변경 기록</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">누가 언제 물건과 공간을 바꿨는지 확인합니다.</p>
          </div>
        </div>
        <ActivityFeed />
      </section>
    </main>
  )
}
