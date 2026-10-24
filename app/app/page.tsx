import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Archive, Map } from 'lucide-react'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.user_metadata.display_name ?? user?.email?.split('@')[0] ?? '사용자'

  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-5 py-10 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-3xl border border-violet-100 bg-white p-7 shadow-sm">
        <span className="grid size-10 place-items-center rounded-xl bg-violet-600 font-bold text-white">
          <Archive size={20} strokeWidth={2.5} />
        </span>
        <p className="mt-7 text-sm font-bold text-violet-600">로그인 완료</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">
          {displayName}님의 수납바구니
        </h1>
        <p className="mt-3 leading-7 text-slate-500">
          계정과 Home 연결이 완료됐어요. 다음 단계에서 위치, 물건, 구성원 화면을 이곳에 연결합니다.
        </p>
        <Link
          href="/app/space"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
        >
          <Map size={17} />
          수납 지도 샘플 보기
        </Link>
      </section>
    </main>
  )
}
