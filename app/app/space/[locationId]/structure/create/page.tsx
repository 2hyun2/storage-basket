import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'
import { notFound } from 'next/navigation'
import { StructureCreateForm } from '@/components/space/structure-create-form'
import { createClient } from '@/lib/supabase/server'

export default async function StructureCreatePage({
  params,
}: {
  params: Promise<{ locationId: string }>
}) {
  const { locationId } = await params
  const supabase = await createClient()
  const { data: location } = await supabase
    .from('locations')
    .select('id, name')
    .eq('id', locationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!location) notFound()

  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-4 py-6 text-slate-950 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-2xl">
        <Link href={`/app/space/${location.id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          {location.name}으로 돌아가기
        </Link>
        <div className="mt-6 rounded-3xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-violet-600"><Construction size={17} /> 구조물 등록</p>
          <h1 className="mt-2 text-3xl font-extrabold">{location.name} 구조 설계</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">벽을 먼저 만들고, 문·창문은 연결할 벽을 선택해 cm 단위로 배치합니다.</p>
          <div className="mt-8"><StructureCreateForm locationId={location.id} /></div>
        </div>
      </section>
    </main>
  )
}
