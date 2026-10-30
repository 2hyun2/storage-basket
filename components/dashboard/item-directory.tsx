'use client'
import { getSpaceIndex } from '@/lib/space/space-index'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FolderSearch, History, MapPinned, Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { ItemDetailDialog } from '@/components/item-detail-dialog'
import { ItemEditorDialog } from '@/components/item-editor-dialog'
import { DeleteItemButton } from '@/components/space/delete-item-button'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'
import {
  type LocalSpace,
} from '@/lib/space/local-spaces'

export function ItemDirectory() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { spaces, items } = useSupabaseInventory()
  const [manualEditor, setManualEditor] = useState<EditorRequest | null>(null)
  const [dismissedQueryKey, setDismissedQueryKey] = useState<string | null>(null)
  const editItemId = searchParams.get('edit')
  const detailItemId = searchParams.get('detail')
  const createLocationId = searchParams.get('location')
  const queryEditor = editItemId && items.some((item) => item.id === editItemId)
    ? { mode: 'edit' as const, itemId: editItemId }
    : searchParams.get('create') === '1'
      ? { mode: 'create' as const }
      : null
  const queryKey = queryEditor?.mode === 'edit'
    ? `edit:${queryEditor.itemId}`
    : queryEditor?.mode === 'create'
      ? `create:${createLocationId ?? ''}`
      : null
  const activeEditor = manualEditor ?? (
    queryKey && dismissedQueryKey !== queryKey ? queryEditor : null
  )
  const editingItem = activeEditor?.mode === 'edit'
    ? items.find((item) => item.id === activeEditor.itemId)
    : undefined
  const detailItem = !activeEditor && detailItemId
    ? items.find((item) => item.id === detailItemId)
    : undefined
  const isCreating = activeEditor?.mode === 'create'

  function closeEditor() {
    setManualEditor(null)
    setDismissedQueryKey(queryKey)
    router.replace('/app/items')
  }

  function closeDetail() {
    router.replace('/app/items')
  }
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
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm font-bold text-slate-500">
          전체 {items.length}종 · 현재 {filteredItems.length}종
        </p>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:max-w-xl sm:flex-nowrap">
          <label className="relative block min-w-0 flex-1">
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
          <Link href="/app/items/trash" className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
            <Trash2 size={15} /> 휴지통
          </Link>
          <button type="button" onClick={() => setManualEditor({ mode: 'create' })} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700">
            <Plus size={15} /> 물건 등록
          </button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="물건 카테고리">
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
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-center">
          <FolderSearch size={24} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-700">아직 등록된 물건이 없습니다.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-center">
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
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <li key={item.id} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-sky-700 shadow-sm">
                    <Package size={16} />
                  </span>
                  <Link href={`/app/items?detail=${item.id}`} className="min-w-0 break-words text-base font-semibold leading-6 text-slate-900 hover:text-violet-700">{item.title}</Link>
                </span>
                <span className="flex shrink-0 flex-col gap-1 text-right text-xs text-slate-600">
                  <span>수량: {item.quantity}</span>
                  <span>단위: {item.unit || '없음'}</span>
                </span>
              </div>
              <div className="mt-3 min-w-0 flex-1">
                  <Link href={`/app/space/${item.locationId}`} className="inline-flex max-w-full items-start gap-1.5 rounded-lg py-0.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100 hover:text-violet-950" title={`${item.title} 보관 위치: ${item.locationPath}`}>
                    <MapPinned size={13} className="shrink-0" />
                    <span className="min-w-0 break-words">{item.locationPath}</span>
                  </Link>
                  {item.category && <p className="mt-1 text-xs text-sky-700">{item.category}</p>}
                  {item.note && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.note}</p>}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setManualEditor({ mode: 'edit', itemId: item.id })}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                >
                  <Pencil size={13} /> 수정
                </button>
                <Link
                  href={`/app/items?detail=${item.id}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-violet-100 hover:text-violet-700"
                  aria-label={`${item.title} 상세 및 기록 보기`}
                  title="상세와 변경 기록"
                >
                  <History size={14} /> 상세
                </Link>
                <DeleteItemButton itemId={item.id} itemName={item.title} showLabel />
              </div>
            </li>
          ))}
        </ul>
      )}
      {(isCreating || editingItem) && (
        <ItemEditorDialog
          item={editingItem}
          initialLocationId={isCreating ? createLocationId ?? undefined : undefined}
          onClose={closeEditor}
        />
      )}
      {detailItem && (
        <ItemDetailDialog
          item={detailItem}
          onClose={closeDetail}
          onEdit={() => router.replace(`/app/items?edit=${detailItem.id}`)}
        />
      )}
    </section>
  )
}

type EditorRequest =
  | { mode: 'create' }
  | { mode: 'edit'; itemId: string }

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
  const spacesById = getSpaceIndex(spaces)
  let currentSpace = spacesById.get(locationId)

  const visited = new Set<string>()
  while (currentSpace && !visited.has(currentSpace.id)) {
    visited.add(currentSpace.id)
    path.unshift(currentSpace.name)
    const parentId = currentSpace.parentId
    currentSpace = parentId
      ? spacesById.get(parentId)
      : undefined
  }

  return path.length > 0 ? path.join(' > ') : '삭제되었거나 알 수 없는 공간'
}
