import Link from 'next/link'
import { ArrowLeft, Map, Plus } from 'lucide-react'
import { PlanMap } from '@/components/space/plan-map'
import { SpaceBreadcrumb } from '@/components/space/space-breadcrumb'
import { getSampleLayout } from '@/lib/space/sample-layout'

export default function SpacePage() {
  const layout = getSampleLayout()

  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-5 py-7 text-slate-950 sm:px-8 sm:py-10">
      <section className="mx-auto max-w-5xl">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          대시보드로 돌아가기
        </Link>

        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-violet-600">
              <Map size={17} />
              수납 지도 샘플
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">우리 집 평면도</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              방을 선택하면 보관소와 서랍으로 순차적으로 들어갈 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SpaceBreadcrumb items={[{ id: 'home', name: '우리 집' }]} />
            <Link href="/app/space/create" className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700">
              <Plus size={16} />
              등록
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <PlanMap layout={layout} />
        </div>
      </section>
    </main>
  )
}
