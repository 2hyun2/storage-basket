import Link from 'next/link'
import { ArrowLeft, Box, Orbit } from 'lucide-react'
import { Storage3dPreview } from '@/components/space/storage-3d-preview'

export default function SpaceDemoPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-4">
      <Link
        href="/app/space"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-violet-700"
      >
        <ArrowLeft size={16} />
        공간 탐색으로 돌아가기
      </Link>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700">
            <Orbit size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-violet-700">3단계 내부 입체 표현 · 임시 데이터</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              오른쪽 서랍 내부
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              AA 건전지, 충전 케이블, 리모컨을 서랍 속에 임시 배치한 장면입니다.
              실제 공간 좌표 저장이 연결되면 해당 공간의 데이터로 교체됩니다.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
          <Storage3dPreview />
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          <Box size={17} className="mt-0.5 shrink-0 text-violet-700" />
          <p>
            드래그로 회전하고, 휠 또는 핀치로 확대·축소할 수 있습니다.
            물건 자체에는 좌표를 저장하지 않고, 이 화면에서는 공간 내부의 물건 목록을 표현합니다.
          </p>
        </div>
      </section>
    </main>
  )
}
