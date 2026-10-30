'use client'

import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { StructureCreateForm } from '@/components/space/structure-create-form'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'

export function StructureCreatePageClient({ locationId }: { locationId: string }) {
  const searchParams = useSearchParams()
  const { spaces, structures, isLoading, error } = useSupabaseInventory()
  const location = spaces.find((space) => space.id === locationId) ?? null

  if (isLoading) {
    return <main className="min-h-dvh bg-[#f5f8fd] px-4 py-4 text-sm font-bold text-slate-500 sm:px-4 sm:py-4">구조 데이터를 불러오는 중입니다.</main>
  }

  if (error || !location) {
    return <main className="min-h-dvh bg-[#f5f8fd] px-4 py-4 text-sm font-bold text-rose-700 sm:px-4 sm:py-4">공간을 불러오지 못했습니다.</main>
  }

  return (
    <main className="min-h-dvh bg-[#f5f8fd] px-4 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-2xl">
        <Link href={`/app/space/${location.id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          {location.name}으로 돌아가기
        </Link>
        <div className="mt-4 rounded-xl border border-violet-100 bg-white p-4 shadow-sm sm:p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-violet-600"><Construction size={17} /> 집 구조 꾸미기</p>
          <h1 className="mt-2 text-3xl font-semibold">{location.name} 벽과 창문</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">이 공간 안에서 벽과 창문의 위치·크기를 cm 단위로 정합니다. 통로는 벽 구간을 비워 표현합니다.</p>
          <div className="mt-8">
            <StructureCreateForm
              key={`${location.id}:${searchParams.get('edit') ?? 'new'}:${structures.find((entry) => entry.id === searchParams.get('edit'))?.id ?? 'loading'}`}
              locationId={location.id}
              locationName={location.name}
              initialEditId={searchParams.get('edit') ?? undefined}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
