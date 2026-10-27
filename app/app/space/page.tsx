import Link from 'next/link'
import { ArrowLeft, Layers3, Plus } from 'lucide-react'
import { LocalSpaceTree } from '@/components/space/local-space-tree'
import { SeedDemoHomeButton } from '@/components/space/seed-demo-home-button'
import { ArchiveResetButton } from '@/components/space/archive-reset-button'
import { HomeLayoutSetup } from '@/components/space/home-layout-setup'

export default function SpacePage() {
  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-4 py-6 text-slate-950 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-5xl">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          대시보드로 돌아가기
        </Link>

        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-violet-600">
              <Layers3 size={17} />
              공간 탐색
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">우리 집 공간</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              방을 선택하면 보관소와 서랍으로 순차적으로 들어갈 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/app/space/create" className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700">
              <Plus size={16} />
              등록
            </Link>
          </div>
        </div>

        <HomeLayoutSetup />
        <LocalSpaceTree />
        <SeedDemoHomeButton />
        <ArchiveResetButton />
      </section>
    </main>
  )
}
