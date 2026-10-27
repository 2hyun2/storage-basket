'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  ChevronDown,
  ChevronRight,
  Cuboid,
  ExternalLink,
  House,
  Layers3,
  ListTree,
  MapPinned,
  Package,
  Type,
} from 'lucide-react'
import type { LocalItem } from '@/lib/space/local-items'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'
import { SpaceOverview3d } from '@/components/space/space-overview-3d'
import type { LocalSpace } from '@/lib/space/local-spaces'

type SpaceView = 'tree' | 'three'

type LocalSpaceTreeNodeProps = {
  space: LocalSpace
  spaces: LocalSpace[]
  items: LocalItem[]
  selectedSpaceId: string | null
  onSelectSpace: (spaceId: string) => void
}

export function LocalSpaceTree() {
  const { spaces, items, homeLayout, placements, isLoading } = useSupabaseInventory()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [view, setView] = useState<SpaceView>('tree')

  const spacesById = useMemo(
    () => new Map(spaces.map((space) => [space.id, space])),
    [spaces],
  )
  const rootSpaces = useMemo(
    () => spaces.filter((space) => space.parentId === null),
    [spaces],
  )
  const selectedSpace = selectedSpaceId ? spacesById.get(selectedSpaceId) ?? null : null

  if (!isLoading && !homeLayout) {
    return null
  }

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700">
            <Layers3 size={18} />
          </span>
          <div>
            <h2 className="font-extrabold text-slate-900">공간 노드</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              텍스트 계층 또는 3D 공간 개요로 확인합니다.
            </p>
          </div>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            aria-pressed={view === 'tree'}
            onClick={() => setView('tree')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition ${
              view === 'tree'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTree size={15} />
            텍스트 트리
          </button>
          <button
            type="button"
            aria-pressed={view === 'three'}
            onClick={() => setView('three')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition ${
              view === 'three'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cuboid size={15} />
            3D 공간
          </button>
        </div>
      </div>

      {view === 'tree' ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-2 sm:p-4">
        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-extrabold text-slate-900 shadow-sm">
          <House size={17} className="text-violet-700" />
          우리 집
        </div>

        {rootSpaces.length === 0 ? (
          <p className="px-3 py-5 text-sm leading-6 text-slate-500">
            아직 우리 집 아래에 등록된 공간이 없습니다. 거실처럼 첫 공간을 만들어 보세요.
          </p>
        ) : (
          <ul className="mt-2 space-y-1" aria-label="공간 노드 목록">
            {rootSpaces.map((space) => (
              <LocalSpaceTreeNode
                key={space.id}
                space={space}
                spaces={spaces}
                items={items}
                selectedSpaceId={selectedSpaceId}
                onSelectSpace={setSelectedSpaceId}
              />
            ))}
          </ul>
        )}
        </div>
      ) : (
        <SpaceOverview3d
          spaces={spaces}
          items={items}
          homeLayout={homeLayout}
          placements={placements}
        />
      )}

      {selectedSpace && (
        <SelectedSpaceSummary
          space={selectedSpace}
          spacesById={spacesById}
          childSpaces={spaces.filter((space) => space.parentId === selectedSpace.id)}
          items={items.filter((item) => item.locationId === selectedSpace.id)}
        />
      )}

      <p className="mt-4 text-xs leading-5 text-slate-400">
        현재 로그인한 Home의 Supabase 공간 데이터를 표시합니다.
      </p>
    </section>
  )
}

function LocalSpaceTreeNode({
  space,
  spaces,
  items,
  selectedSpaceId,
  onSelectSpace,
}: LocalSpaceTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const children = spaces.filter((child) => child.parentId === space.id)
  const directItems = items.filter((item) => item.locationId === space.id)
  const hasChildren = children.length > 0
  const isSelected = selectedSpaceId === space.id
  const RegistrationIcon = space.mode === 'map' ? MapPinned : Type

  return (
    <li>
      <div className="flex items-center gap-1">
        {hasChildren ? (
          <button
            type="button"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-200"
            aria-label={`${space.name} ${isExpanded ? '접기' : '펼치기'}`}
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
          </button>
        ) : (
          <span className="size-8 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelectSpace(space.id)}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
            isSelected
              ? 'bg-violet-100 font-bold text-violet-800'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Box size={16} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{space.name}</span>
          <RegistrationIcon size={15} className="shrink-0 opacity-65" />
        </button>
        <Link href={`/app/space/${space.id}`} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-violet-100 hover:text-violet-700" aria-label={`${space.name} 상세 보기`}>
          <ExternalLink size={15} />
        </Link>
      </div>

      {directItems.length > 0 && (
        <div className="ml-9 mt-1 flex min-w-0 items-center gap-1.5 px-3 text-xs text-slate-500">
          <Package size={13} className="shrink-0 text-sky-700" />
          <span className="truncate">
            {directItems.slice(0, 2).map((item) => item.title).join(' · ')}
            {directItems.length > 2 && ` 외 ${directItems.length - 2}개`}
          </span>
        </div>
      )}

      {hasChildren && isExpanded && (
        <ul className="ml-4 border-l border-slate-200 pl-2">
          {children.map((child) => (
            <LocalSpaceTreeNode
              key={child.id}
              space={child}
              spaces={spaces}
              items={items}
              selectedSpaceId={selectedSpaceId}
              onSelectSpace={onSelectSpace}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

type SelectedSpaceSummaryProps = {
  space: LocalSpace
  spacesById: Map<string, LocalSpace>
  childSpaces: LocalSpace[]
  items: LocalItem[]
}

function SelectedSpaceSummary({
  space,
  spacesById,
  childSpaces,
  items,
}: SelectedSpaceSummaryProps) {
  const path = getLocalSpacePath(space, spacesById)
  const isLeafSpace = childSpaces.length === 0

  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
      <p className="text-sm font-extrabold text-violet-950">{space.name}</p>
      <p className="mt-1 text-xs leading-5 text-violet-800">경로: 우리 집 &gt; {path.join(' > ')}</p>
      <p className="mt-1 text-xs leading-5 text-violet-700">
        등록 방식: {space.mode === 'map' ? '지도 배치 등록' : '간편 등록'}
      </p>
      <div className="mt-3 border-t border-violet-200 pt-3">
        <p className="text-xs font-extrabold text-violet-950">이 공간의 물건 {items.length}개</p>
        {items.length === 0 ? (
          <p className="mt-1 text-xs leading-5 text-violet-700">직접 보관된 물건이 아직 없습니다.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-xs text-violet-900">
                <span className="min-w-0 truncate">{item.title}</span>
                <strong className="shrink-0">{item.quantity}{item.unit}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href={`/app/space/${space.id}`}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-violet-800"
      >
        {isLeafSpace ? <Cuboid size={16} /> : <ExternalLink size={16} />}
        {isLeafSpace ? '3D 내부 보기' : '이 공간으로 들어가기'}
      </Link>
    </div>
  )
}

function getLocalSpacePath(space: LocalSpace, spacesById: Map<string, LocalSpace>) {
  const path = [space.name]
  let parentId = space.parentId

  while (parentId) {
    const parent = spacesById.get(parentId)

    if (!parent) {
      break
    }

    path.unshift(parent.name)
    parentId = parent.parentId
  }

  return path
}
