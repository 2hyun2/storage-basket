import Link from 'next/link'
import { ArrowLeft, Box, ChevronRight, Package, Plus } from 'lucide-react'

const registrationOptions = [
  {
    href: '/app/space/create',
    icon: Box,
    tone: 'bg-violet-100 text-violet-700',
    title: '공간 등록',
    description: '방, 수납장, 서랍처럼 물건을 둘 공간을 만듭니다.',
    hint: '이름과 들어갈 곳을 정한 뒤, 필요할 때 3D 자리도 배치할 수 있어요.',
  },
  {
    href: '/app/items?create=1',
    icon: Package,
    tone: 'bg-sky-100 text-sky-700',
    title: '물건 등록',
    description: '이름, 수량, 메모와 보관 위치를 함께 기록합니다.',
    hint: '물건에는 좌표를 넣지 않아요. 이미 만든 보관 공간 하나를 선택합니다.',
  },
]

export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-[#f5f8fd] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-2xl">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition hover:text-violet-700">
          <ArrowLeft size={17} />
          홈
        </Link>

        <header className="mt-4 rounded-xl border border-violet-100 bg-white p-4 shadow-sm sm:p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-violet-600"><Plus size={17} /> 등록</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-3xl">무엇을 등록할까요?</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">공간을 먼저 만들면 그 안에 물건을 기록할 수 있습니다.</p>
        </header>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {registrationOptions.map(({ href, icon: Icon, tone, title, description, hint }) => (
            <Link key={href} href={href} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-4">
              <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
              <h2 className="mt-4 flex items-center justify-between gap-2 text-lg font-semibold text-slate-950">{title}<ChevronRight size={18} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet-700" /></h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">{hint}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
