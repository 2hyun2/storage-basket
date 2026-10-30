import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  KeyRound,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
    : { data: null }
  const displayName = profile?.display_name ?? user?.user_metadata.display_name ?? user?.email?.split('@')[0] ?? '사용자'
  const email = user?.email ?? ''
  const initial = displayName.slice(0, 1)

  return (
    <main className="min-h-dvh bg-[#f5f8fd] px-4 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-3xl">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-700">
          <ArrowLeft size={17} />
          홈
        </Link>

        <div className="mt-4">
          <p className="flex items-center gap-2 text-sm font-bold text-violet-600">
            <UserRound size={17} />
            내 계정
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-3xl">마이페이지</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            내 계정 정보와 로그인 설정을 관리합니다.
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
          <div className="flex items-center gap-4 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-4 text-white sm:px-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-white/20 text-xl font-semibold ring-1 ring-white/30">
              {initial}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-lg">{displayName}</strong>
              <span className="mt-1 block truncate text-sm text-violet-100">{email}</span>
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            <SettingRow icon={UserRound} label="표시 이름" description={displayName} action="수정" />
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-4">
          <SectionHeading icon={ShieldCheck} title="로그인 및 보안" description="계정에 접속하는 방법을 관리합니다." />
          <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
            <SettingRow href="/app/my/password" icon={KeyRound} label="비밀번호" description="현재 비밀번호를 새 비밀번호로 변경" action="변경" />
            <SettingRow href="/app/my/session" icon={ShieldCheck} label="로그인 상태" description="이 기기에서 로그인 유지 여부를 관리" action="변경" />
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-4">
          <SectionHeading icon={Bell} title="알림" description="변경 기록과 초대 알림 설정을 준비하고 있습니다." />
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
            물건 이동, 초대, 공동체 활동 알림은 Home 기능과 함께 다음 단계에서 연결합니다.
          </div>
        </section>
      </section>
    </main>
  )
}

type SectionHeadingProps = {
  icon: typeof UserRound
  title: string
  description: string
}

function SectionHeading({ icon: Icon, title, description }: SectionHeadingProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
        <Icon size={18} />
      </span>
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  )
}

type SettingRowProps = {
  href?: string
  icon: typeof UserRound
  label: string
  description: string
  action: string
}

function SettingRow({ href, icon: Icon, label, description, action }: SettingRowProps) {
  const content = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-slate-800">{label}</span>
        <span className="mt-0.5 block truncate text-sm text-slate-500">{description}</span>
      </span>
      <span className="inline-flex items-center gap-1 text-sm font-bold text-violet-700">
        {action}
        <ChevronRight size={16} />
      </span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50">
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
    >
      {content}
    </button>
  )
}
