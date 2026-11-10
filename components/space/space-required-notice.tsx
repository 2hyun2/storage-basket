import Link from 'next/link'
import { Box, ChevronRight } from 'lucide-react'

export function SpaceRequiredNotice() {
  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50 p-4">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
        <Box size={18} aria-hidden="true" /> 첫 번째 단계 · 공간 등록
      </span>
      <h2 className="mt-3 text-xl font-semibold text-slate-950 sm:text-2xl">물건을 보관할 공간부터 만들어 주세요</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        아직 등록된 공간이 없어요. 방, 수납장, 서랍 등 보관 공간을 하나 만든 뒤 물건을 등록할 수 있습니다.
      </p>
      <Link href="/app/space/create" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
        공간 먼저 등록하기 <ChevronRight size={17} aria-hidden="true" />
      </Link>
    </section>
  )
}
