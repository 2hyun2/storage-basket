'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Archive,
  History,
  House,
  LogOut,
  Menu,
  Settings2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { logout } from '@/app/(auth)/actions'

type AppHeaderProps = {
  displayName: string
  email: string
}

const navigationItems = [
  { href: '/app', label: '홈', description: '물건 검색과 수납 현황', icon: House },
  { href: '/app/space', label: '공간 탐색', description: '우리 집 공간과 3D 배치', icon: Settings2 },
  { href: '/app/community', label: '공동체', description: '구성원과 초대 코드 관리', icon: UsersRound },
  { href: '/app/archive', label: '변경 기록', description: '물건과 공간의 변경 내역', icon: History },
  { href: '/app/my', label: '마이페이지', description: '계정과 로그인 설정', icon: UserRound },
]

export function AppHeader({ displayName, email }: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-violet-100 bg-white/95 px-2 py-2 backdrop-blur sm:px-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link
          href="/app"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-2 font-bold"
        >
          <span className="flex items-center justify-center size-10 text-violet-700 bg-white rounded-lg">
              <Archive size={30} strokeWidth={2} />
          </span>
          <span className="truncate">우리집 공간록</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="주요 메뉴">
          {navigationItems.slice(0, 3).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/app/my"
            className="hidden items-center gap-2 rounded-xl bg-violet-50 px-2 py-2 text-sm transition hover:bg-violet-100 lg:flex"
          >
            <UserRound size={16} className="text-violet-700" />
            <span className="max-w-24 truncate font-bold text-slate-800">{displayName}</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation-menu"
            aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-violet-100 hover:text-violet-700"
          >
            {isMenuOpen ? <X size={19} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div id="main-navigation-menu" className="mx-auto mt-2 max-w-5xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{email}</p>
          </div>
          <nav className="mt-1 grid gap-1 sm:grid-cols-2" aria-label="전체 메뉴">
            {navigationItems.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-violet-50"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-sm text-slate-900">{label}</strong>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{description}</span>
                </span>
              </Link>
            ))}
          </nav>
          <form action={logout} className="mt-1 border-t border-slate-100 pt-1">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700">
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100">
                <LogOut size={17} />
              </span>
              로그아웃
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
