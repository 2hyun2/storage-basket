import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { TrashItemDirectory } from '@/components/trash-item-directory'

export default function TrashItemsPage() {
  return (
    <main className="min-h-dvh bg-[#f5f8fd] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-5xl">
        <Link href="/app/items" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition hover:text-violet-700">
          <ArrowLeft size={17} />
          물건 목록
        </Link>
        <div className="mt-4 flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-slate-200 text-slate-700"><Trash2 size={20} /></span>
          <div>
            <p className="text-sm font-bold text-slate-600">물건 관리</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">휴지통</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">공간을 정리하면서 보관한 물건을 복원합니다.</p>
          </div>
        </div>
        <TrashItemDirectory />
      </section>
    </main>
  )
}
