import {
  Archive,
  Battery,
  Box,
  Cuboid,
  MapPinned,
  Search,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { LandingHomeDemo } from '@/components/landing-home-demo'
import { createClient } from '@/lib/supabase/server'

type Feature = {
  number: string
  title: string
  description: string
  icon: LucideIcon
}

const features: Feature[] = [
  {
    number: '01',
    title: '어디에 뒀는지 바로 찾기',
    description: '방, 서랍, 상자처럼 내 공간을 나누고 물건을 기록해요.',
    icon: Search,
  },
  {
    number: '02',
    title: '함께 정리하기',
    description: '같은 Home 구성원과 물건 위치를 함께 관리해요.',
    icon: UsersRound,
  },
  {
    number: '03',
    title: '3D로 꾸미며 정리하기',
    description: '우리 집 격자 위에 방과 수납공간을 직접 배치해요.',
    icon: Cuboid,
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/app')
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#f8f7ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#211a4c] px-5 pb-12 pt-5 text-white sm:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-16 top-16 size-56 rounded-full bg-violet-500/35 blur-3xl" />
          <div className="absolute -left-20 bottom-0 size-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
        </div>

        <nav className="mx-auto flex max-w-[1440px] items-center justify-between">
          <a href="#top" className="flex items-center gap-2 font-bold tracking-tight" aria-label="우리집 공간록 첫 화면">
            <span className="grid size-9 place-items-center rounded-xl bg-white text-violet-700 shadow-lg shadow-violet-950/20">
              <Archive size={19} strokeWidth={2.5} />
            </span>
            <span>우리집 공간록</span>
          </a>
          <a href="/login" className="rounded-full border border-white/20 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/10">로그인</a>
        </nav>

        <div id="top" className="mx-auto max-w-[1440px] pt-14 sm:pt-20">
          <p className="inline-flex rounded-full border border-violet-300/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-100">3D로 꾸미며 정리하는 우리 집 기록</p>
          <h1 className="mt-5 text-[2.55rem] font-extrabold leading-[1.13] tracking-[-0.06em] sm:text-6xl">
            내 공간을 직접 만들고,
            <br />
            <span className="text-violet-300">물건의 자리를 기억하세요.</span>
          </h1>
          <p className="mt-5 max-w-md text-[0.98rem] leading-7 text-violet-100/80 sm:text-lg">
            집의 크기부터 방·수납공간·물건까지. 3D 격자 위에서 꾸미듯 배치하고 함께 기록하는 우리 집 공간록.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/signup" className="rounded-2xl bg-white px-5 py-3.5 text-center text-sm font-bold text-violet-800 shadow-xl shadow-violet-950/30 transition hover:-translate-y-0.5">우리집 공간록 만들기</a>
            <a href="#features" className="rounded-2xl border border-white/20 px-5 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/10">어떻게 쓰나요?</a>
          </div>

          <div className="mt-8 grid overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl shadow-black/30 md:grid-cols-[minmax(0,1.4fr)_minmax(280px,.8fr)]">
          <LandingHomeDemo />
          <div className="relative min-w-0 border-t border-slate-200 bg-white p-3 md:border-l md:border-t-0">
            <div className="overflow-hidden rounded-[1.5rem] bg-slate-50 text-slate-900">
              <div className="flex items-center justify-between bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-violet-600 text-white">
                    <Archive size={15} strokeWidth={2.5} />
                  </span>
                  <div><p className="text-xs font-bold">우리집 공간록</p><p className="text-[10px] text-slate-400">우리 집 물건 찾기</p></div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">정리 중</span>
              </div>
              <div className="p-4">
                <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                  <div className="flex items-center justify-between"><p className="text-[11px] font-semibold text-violet-600">3D 공간 설계</p><Cuboid size={15} className="text-violet-600" /></div>
                  <div className="mt-2 grid aspect-[16/8] grid-cols-6 grid-rows-4 gap-1 rounded-lg border border-violet-200 bg-white p-1 [background-image:linear-gradient(#ede9fe_1px,transparent_1px),linear-gradient(90deg,#ede9fe_1px,transparent_1px)] [background-size:10px_10px]">
                    <span className="col-span-3 row-span-4 rounded-md border border-violet-300 bg-violet-300/50 p-1 text-[9px] font-bold text-violet-900">거실</span>
                    <span className="col-span-3 row-span-2 rounded-md border border-sky-300 bg-sky-200/60 p-1 text-[9px] font-bold text-sky-900">주방</span>
                    <span className="col-span-3 row-span-2 rounded-md border border-rose-300 bg-rose-200/60 p-1 text-[9px] font-bold text-rose-900">안방</span>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">방을 배치하고, 내부 수납공간까지 이어서 기록</p>
                </div>
                <div className="mt-4 flex items-center justify-between"><p className="text-xs font-bold">내 공간</p><span className="text-[10px] font-medium text-violet-600">전체 보기</span></div>
                <div className="mt-2 space-y-2">
                  <MockLocation name="거실" count="12" color="bg-amber-100 text-amber-700" icon={MapPinned} />
                  <MockLocation name="주방" count="8" color="bg-rose-100 text-rose-700" icon={Box} />
                  <MockLocation name="베란다 캠핑 박스" count="5" color="bg-sky-100 text-sky-700" icon={Battery} />
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24">
        <p className="text-sm font-bold text-violet-600">SIMPLE, TOGETHER</p>
        <h2 className="mt-3 max-w-lg text-3xl font-extrabold leading-tight tracking-[-0.05em] sm:text-4xl">찾고, 함께 정리하고,<br />기억하는 공간.</h2>
        <div className="mt-9 grid gap-3 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm shadow-violet-100/50">
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
                  <feature.icon size={20} strokeWidth={2.25} />
                </span>
                <span className="text-xs font-bold text-violet-300">{feature.number}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-violet-600 px-4 py-8 text-white sm:px-4">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-sm font-semibold text-violet-200">내 공간을 더 쉽게 기억하세요</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.05em]">이제 수납부터 기록해 볼까요?</h2>
          <a href="/signup" className="mt-4 inline-block rounded-2xl bg-white px-4 py-3 text-sm font-bold text-violet-700 shadow-lg shadow-violet-900/20 transition hover:-translate-y-0.5">무료로 시작하기</a>
        </div>
      </section>
    </main>
  )
}

type MockLocationProps = {
  name: string
  count: string
  color: string
  icon: LucideIcon
}

function MockLocation({ name, count, color, icon: Icon }: MockLocationProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm">
      <span className={`grid size-8 place-items-center rounded-lg ${color}`}>
        <Icon size={15} strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-semibold">{name}</span>
      <span className="text-[10px] text-slate-400">물건 {count}</span>
    </div>
  )
}
