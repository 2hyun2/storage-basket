import Link from 'next/link'
import { Archive, LogOut, UserRound } from 'lucide-react'
import { logout } from '@/app/(auth)/actions'

type AppHeaderProps = {
  displayName: string
  email: string
}

export function AppHeader({ displayName, email }: AppHeaderProps) {
  return (
    <header className="border-b border-violet-100 bg-white/90 px-4 py-2 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link href="/app" className="flex items-center gap-2 font-extrabold tracking-tight text-slate-950">
          <span className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white">
            <Archive size={18} strokeWidth={2.5} />
          </span>
          수납바구니
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/app/my" className="hidden items-center gap-2 rounded-xl bg-violet-50 px-2 py-2 text-sm transition hover:bg-violet-100 sm:flex">
            <UserRound size={16} className="text-violet-700" />
            <span className="max-w-32 truncate font-bold text-slate-800">{displayName}</span>
            <span className="max-w-40 truncate text-slate-500">{email}</span>
          </Link>
          <Link
            href="/app/my"
            className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700 transition hover:bg-violet-100 sm:hidden"
            aria-label="마이페이지"
          >
            <UserRound size={17} />
          </Link>
          <form action={logout}>
            <button
              className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              title="로그아웃"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
