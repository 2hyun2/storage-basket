import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import { ItemDirectory } from '@/components/dashboard/item-directory'

export default function ItemsPage() {
  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-5xl">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          홈
        </Link>
        <div className="mt-7 flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-sky-100 text-sky-700"><Package size={20} /></span>
          <div>
            <p className="text-sm font-bold text-sky-700">전체 물건</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">물건 목록</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">이름, 수량, 보관 위치를 한 번에 확인합니다.</p>
          </div>
        </div>
        <ItemDirectory />
      </section>
    </main>
  )
}
