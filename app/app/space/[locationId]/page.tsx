import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { PlanMap } from '@/components/space/plan-map'
import { SpaceBreadcrumb } from '@/components/space/space-breadcrumb'
import { getSampleLayout, sampleParents } from '@/lib/space/sample-layout'

type SpaceLocationPageProps = {
  params: Promise<{ locationId: string }>
}

export default async function SpaceLocationPage({ params }: SpaceLocationPageProps) {
  const { locationId } = await params
  const layout = getSampleLayout(locationId)
  const breadcrumbItems = getBreadcrumbItems(layout.id)
  const parentId = sampleParents[layout.id] ?? 'home'
  const backHref = parentId === 'home' ? '/app/space' : `/app/space/${parentId}`

  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-5 py-7 text-slate-950 sm:px-8 sm:py-10">
      <section className="mx-auto max-w-5xl">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          상위 위치로 돌아가기
        </Link>

        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-violet-600">
              <MapPin size={17} />
              수납 지도 샘플
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">
              {layout.locationName} 내부
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              현재 위치 안의 다음 보관 단계를 표시합니다.
            </p>
          </div>
          <SpaceBreadcrumb items={breadcrumbItems} />
        </div>

        <div className="mt-8">
          <PlanMap layout={layout} />
        </div>
      </section>
    </main>
  )
}

function getBreadcrumbItems(locationId: string) {
  const items: { id: string; name: string }[] = []
  let currentId: string | null = locationId

  while (currentId) {
    const layout = getSampleLayout(currentId)
    items.unshift({ id: layout.id, name: layout.locationName })
    currentId = sampleParents[currentId] ?? null
  }

  return items
}
