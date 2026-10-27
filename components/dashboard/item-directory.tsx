'use client'

import { useMemo, useState } from 'react'
import { FolderSearch, Package, Search, X } from 'lucide-react'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'
import {
  type LocalSpace,
} from '@/lib/space/local-spaces'

export function ItemDirectory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { spaces, items } = useSupabaseInventory()
  const itemsWithPath = useMemo(
    () => items.map((item) => ({ ...item, locationPath: getLocationPath(item.locationId, spaces) })),
    [items, spaces],
  )
  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter((category): category is string => Boolean(category)))].sort((left, right) => left.localeCompare(right, 'ko')),
    [items],
  )
  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR')

    return itemsWithPath
      .filter((item) => !selectedCategory || item.category === selectedCategory)
      .filter((item) => {
        if (!normalizedQuery) {
          return true
        }

        const searchableText = [item.title, item.category ?? '', item.locationPath]
          .join(' ')
          .toLocaleLowerCase('ko-KR')

        return searchableText.includes(normalizedQuery)
      })
      .sort((left, right) => left.title.localeCompare(right.title, 'ko'))
  }, [itemsWithPath, searchQuery, selectedCategory])

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm font-bold text-slate-500">
          전체 {items.length}종 · 현재 {filteredItems.length}종
        </p>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">물건 검색</span>
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="물건명 또는 보관 위치 검색"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              aria-label="검색어 지우기"
            >
              <X size={16} />
            </button>
          )}
        </label>
      </div>

      {categories.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2" aria-label="물건 카테고리">
          <CategoryFilter
            label="전체"
            count={items.length}
            selected={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
          />
          {categories.map((category) => (
            <CategoryFilter
              key={category}
              label={category}
              count={items.filter((item) => item.category === category).length}
              selected={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-8 text-center">
          <FolderSearch size={24} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-700">아직 등록된 물건이 없습니다.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-8 text-center">
          <FolderSearch size={24} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-700">조건에 맞는 물건이 없습니다.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory(null)
            }}
            className="mt-3 text-sm font-bold text-violet-700 hover:text-violet-900"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <li key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-sky-700 shadow-sm">
                    <Package size={16} />
                  </span>
                  <strong className="truncate text-sm text-slate-900">{item.title}</strong>
                </span>
                <strong className="shrink-0 text-sm text-slate-700">{item.quantity}{item.unit}</strong>
              </div>
              <p className="mt-3 truncate text-xs text-slate-500">{item.locationPath}</p>
              {item.category && <p className="mt-1 text-xs text-sky-700">{item.category}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

type CategoryFilterProps = {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}

function CategoryFilter({ label, count, selected, onClick }: CategoryFilterProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-xs font-bold transition ${
        selected
          ? 'bg-violet-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700'
      }`}
    >
      {label} {count}
    </button>
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
