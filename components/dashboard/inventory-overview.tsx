'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Box,
  Layers3,
  Map,
  Package,
  Plus,
  Search,
} from 'lucide-react'
import type { LocalItem } from '@/lib/space/local-items'
import type { LocalSpace } from '@/lib/space/local-spaces'
import {
  type HomeLayout,
  type SpacePlacement,
  useSupabaseInventory,
} from '@/lib/space/use-supabase-inventory'
import { SpaceOverview3d } from '@/components/space/space-overview-3d'

type InventoryOverviewProps = {
  displayName: string
}

export function InventoryOverview({ displayName }: InventoryOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { spaces, items, homeLayout, placements } = useSupabaseInventory()

  const itemsWithPath = useMemo(
    () => items.map((item) => ({ ...item, locationPath: getLocationPath(item.locationId, spaces) })),
    [items, spaces],
  )
  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter((category): category is string => Boolean(category)))],
    [items],
  )
  const visibleItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR')

    return itemsWithPath
      .filter((item) => !selectedCategory || item.category === selectedCategory)
      .filter((item) => {
        if (!normalizedQuery) {
          return true
        }

        return [item.title, item.category ?? '', item.locationPath]
          .join(' ')
          .toLocaleLowerCase('ko-KR')
          .includes(normalizedQuery)
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
  }, [itemsWithPath, searchQuery, selectedCategory])
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold text-violet-600">{displayName}님의 Home</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">수납 현황</h1>
          </div>
          <Link
            href="/app/space/create"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus size={16} />
            새로 등록
          </Link>
        </header>

        <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">빠른 물건 찾기</h2>
              <p className="mt-1 text-sm text-slate-500">물건명, 분류, 보관 위치로 바로 찾습니다.</p>
            </div>
            <Link href="/app/items" className="inline-flex items-center gap-1 text-sm font-bold text-violet-700 hover:text-violet-900">
              전체 물건 관리
              <ArrowRight size={16} />
            </Link>
          </div>

          <label className="relative mt-5 block">
            <span className="sr-only">메인 물건 검색</span>
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="예: 건전지, 부엌, 오른쪽 서랍"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2" aria-label="빠른 카테고리 필터">
            <QuickCategory
              label="전체"
              selected={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
            />
            {categories.map((category) => (
              <QuickCategory
                key={category}
                label={category}
                selected={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              />
            ))}
          </div>

          <QuickSearchResults
            items={visibleItems}
            hasItems={items.length > 0}
            hasSearchCondition={Boolean(searchQuery || selectedCategory)}
          />
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard icon={Layers3} label="등록된 공간" value={`${spaces.length}곳`} tone="violet" />
          <StatCard icon={Package} label="물건 종류" value={`${items.length}개`} tone="sky" />
          <StatCard icon={Box} label="물건 수량 합계" value={`${totalQuantity}개`} tone="amber" />
        </section>

        <section className="mt-4 grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Home3dPreview
            spaces={spaces}
            homeLayout={homeLayout}
            placements={placements}
          />
          <QuickLinks />
        </section>
      </section>
    </main>
  )
}

type StatCardProps = {
  icon: typeof Box
  label: string
  value: string
  tone: 'violet' | 'sky' | 'amber'
}

function StatCard({ icon: Icon, label, value, tone }: StatCardProps) {
  const toneClassName = {
    violet: 'bg-violet-100 text-violet-700',
    sky: 'bg-sky-100 text-sky-700',
    amber: 'bg-amber-100 text-amber-700',
  }[tone]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`grid size-9 place-items-center rounded-xl ${toneClassName}`}>
        <Icon size={18} />
      </span>
      <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
    </div>
  )
}

type QuickCategoryProps = {
  label: string
  selected: boolean
  onClick: () => void
}

function QuickCategory({ label, selected, onClick }: QuickCategoryProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-xs font-bold transition ${
        selected
          ? 'bg-violet-600 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700'
      }`}
    >
      {label}
    </button>
  )
}

type QuickSearchResultsProps = {
  items: Array<LocalItem & { locationPath: string }>
  hasItems: boolean
  hasSearchCondition: boolean
}

function QuickSearchResults({ items, hasItems, hasSearchCondition }: QuickSearchResultsProps) {
  if (!hasItems) {
    return (
      <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
        아직 등록한 물건이 없습니다. 공간 화면에서 물건 더미를 채우거나 새 물건을 등록해 보세요.
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
        {hasSearchCondition ? '검색 조건에 맞는 물건이 없습니다.' : '표시할 물건이 없습니다.'}
      </p>
    )
  }

  return (
    <ul className="mt-5 divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
              <Package size={17} />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm text-slate-900">{item.title}</strong>
              <span className="block truncate text-xs text-slate-500">{item.locationPath}</span>
            </span>
          </span>
          <strong className="shrink-0 text-sm text-slate-700">{item.quantity}{item.unit}</strong>
        </li>
      ))}
    </ul>
  )
}

function Home3dPreview({
  spaces,
  homeLayout,
  placements,
}: {
  spaces: LocalSpace[]
  homeLayout: HomeLayout | null
  placements: SpacePlacement[]
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-slate-900">우리 집 공간</p>
          <p className="mt-1 text-sm text-slate-500">평면도에서 보관 위치를 따라 들어갑니다.</p>
        </div>
        <Map size={20} className="text-violet-700" />
      </div>
      {spaces.length > 0 ? (
        <SpaceOverview3d
          spaces={spaces}
          homeLayout={homeLayout}
          placements={placements}
        />
      ) : (
        <div className="mt-5 grid aspect-[16/7] place-items-center rounded-2xl bg-slate-100 p-3 text-center text-sm font-bold text-slate-500">
          공간을 등록하면 이곳에 3D 집 구조가 표시됩니다.
        </div>
      )}
      <Link href="/app/space" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-violet-700 hover:text-violet-900">
        공간 탐색하기
        <ArrowRight size={16} />
      </Link>
    </section>
  )
}

function QuickLinks() {
  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-sm font-extrabold text-slate-900">바로가기</p>
      <div className="mt-4 space-y-3">
        <Link href="/app/space" className="flex items-center gap-3 rounded-2xl bg-violet-50 p-4 transition hover:bg-violet-100">
          <span className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white"><Map size={18} /></span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm text-violet-950">공간 지도와 노드</strong>
            <span className="mt-1 block text-xs leading-5 text-violet-700">우리 집부터 서랍까지 경로를 확인합니다.</span>
          </span>
          <ArrowRight size={17} className="shrink-0 text-violet-700" />
        </Link>
        <Link href="/app/items" className="flex items-center gap-3 rounded-2xl bg-sky-50 p-4 transition hover:bg-sky-100">
          <span className="grid size-9 place-items-center rounded-xl bg-sky-600 text-white"><Package size={18} /></span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm text-sky-950">전체 물건</strong>
            <span className="mt-1 block text-xs leading-5 text-sky-700">보관 위치와 수량을 한 목록에서 봅니다.</span>
          </span>
          <ArrowRight size={17} className="shrink-0 text-sky-700" />
        </Link>
      </div>
    </section>
  )
}

function getLocationPath(locationId: string, spaces: LocalSpace[]) {
  const path: string[] = []
  let currentSpace = spaces.find((space) => space.id === locationId)

  while (currentSpace) {
    path.unshift(currentSpace.name)
    const parentId = currentSpace.parentId
    currentSpace = parentId
      ? spaces.find((space) => space.id === parentId)
      : undefined
  }

  return path.length > 0 ? `우리 집 > ${path.join(' > ')}` : '삭제되었거나 알 수 없는 공간'
}
