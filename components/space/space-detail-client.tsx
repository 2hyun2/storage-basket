'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Box, ChevronRight, Construction, History, House, Package, Pencil, Plus } from 'lucide-react'
import {
  type SceneLayoutData,
  type SceneNestedChild,
  type SceneSiblingPlacement,
  SpaceInterior3d,
} from '@/components/space/space-interior-3d'
import { DrawPlacementDialog } from '@/components/space/draw-placement-dialog'
import { DeleteItemButton } from '@/components/space/delete-item-button'
import { DeleteSpaceButton } from '@/components/space/delete-space-button'
import { SpacePanelVisibilityButton } from '@/components/space/space-panel-visibility-button'
import { SpaceColorPicker } from '@/components/space/space-color-picker'
import { SpaceNameEditor } from '@/components/space/space-name-editor'
import {
  type HomeLayout,
  type SceneLayout,
  useSupabaseInventory,
} from '@/lib/space/use-supabase-inventory'

export function SpaceDetailClient({ locationId, draw }: { locationId: string; draw?: string }) {
  const {
    spaces,
    items,
    homeLayout,
    layouts,
    placements,
    structures,
    isLoading,
    error,
  } = useSupabaseInventory()
  const router = useRouter()
  const location = spaces.find((space) => space.id === locationId) ?? null
  const parentLayout = location
    ? location.parentId
      ? layouts.find((layout) => layout.sceneLocationId === location.parentId) ?? null
      : homeLayout
    : null
  const ownSceneLayout = location
    ? layouts.find((layout) => layout.sceneLocationId === location.id) ?? null
    : null

  if (isLoading) {
    return <SpaceDetailLoading />
  }

  if (error || !location) {
    return (
      <main className="min-h-dvh bg-[#f5f8fd] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
        <section className="mx-auto max-w-5xl rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-700">
          {error ? '공간 데이터를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.' : '찾을 수 없거나 권한이 없는 공간입니다.'}
        </section>
      </main>
    )
  }

  const children = spaces
    .filter((space) => space.parentId === location.id)
    .sort((left, right) => left.name.localeCompare(right.name, 'ko'))
  const directItems = items
    .filter((item) => item.locationId === location.id)
    .sort((left, right) => left.title.localeCompare(right.title, 'ko'))
  const sceneLayoutRow = ownSceneLayout
  const sceneLayout = toSceneLayout(sceneLayoutRow)
  const scenePlacements = sceneLayoutRow
    ? placements.filter((placement) => placement.layoutId === sceneLayoutRow.id)
    : []
  const sceneStructures = sceneLayoutRow
    ? structures.filter((structure) => structure.layoutId === sceneLayoutRow.id)
    : []
  const sceneNestedChildren = getNestedChildren(children, spaces, layouts, placements)
  const editablePlacement = parentLayout
    ? placements.find((placement) => placement.layoutId === parentLayout.id && placement.locationId === location.id) ?? null
    : null
  const siblingPlacements = getSiblingPlacements({
    locationId: location.id,
    parentId: location.parentId,
    spaces,
    placements,
    structures,
    parentLayout,
  })
  const spacePath = getSpacePath(location.id, spaces)

  return (
    <main className="min-h-dvh bg-[#f5f8fd] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-5xl">
        <Link
          href={location.parentId ? `/app/space/${location.parentId}` : '/app/space'}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition hover:text-violet-700"
        >
          <ArrowLeft size={17} />
          뒤로가기
        </Link>

        {draw === '1' && (
          <DrawPlacementDialog
            locationId={location.id}
            name={location.name}
            layoutId={parentLayout?.id ?? null}
            placement={editablePlacement}
            bounds={toSceneLayout(parentLayout)}
            siblingPlacements={siblingPlacements}
          />
        )}

        <SpacePathNavigation path={spacePath} />

        <header className="mt-4 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700">
            <Box size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-violet-700">공간 상세</p>
            <h1 className="mt-1 text-3xl font-semibold">{location.name}</h1>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/app/space/create?inside=${location.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <Plus size={16} />
            이 안에 공간 만들기
          </Link>
          <Link
            href={`/app/items?create=1&location=${location.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
          >
            <Package size={16} />
            이곳에 물건 등록
          </Link>
          <SpaceNameEditor locationId={location.id} initialName={location.name} />
          <SpaceColorPicker locationId={location.id} initialColor={location.colorHex} />
          <SpacePanelVisibilityButton locationId={location.id} initialVisibility={location.isPanelVisible !== false} />
          <Link
            href={`/app/space/${location.id}/structure/create`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <Construction size={16} />
            벽·창문 설계
          </Link>
          <Link
            href={`/app/archive?space=${location.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <History size={16} />
            변경 기록
          </Link>
        </div>

        <section className="mt-4 grid gap-3 border border-slate-200 bg-white p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-semibold text-slate-900">공간 정보</p>
            <p className="mt-1 leading-6 text-slate-500">
              {sceneLayout
                ? `가로 X ${sceneLayout.widthCm}cm · 세로 Y ${sceneLayout.depthCm}cm${sceneLayout.heightCm ? ` · 높이 ${sceneLayout.heightCm}cm` : ''}`
                : '아직 3D 자리와 크기를 정하지 않은 텍스트 공간입니다.'}
            </p>
          </div>
          <Link
            href={`/app/space/${location.id}?draw=1`}
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            {editablePlacement ? '3D 수정' : '3D 자리 정하기'}
          </Link>
        </section>

        <SpaceInterior3d
          spaceName={location.name}
          childSpaces={children.map((child) => ({
            id: child.id,
            name: child.name,
            is_panel_visible: child.isPanelVisible,
            colorHex: child.colorHex,
          }))}
          items={directItems.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unit: item.unit,
          }))}
          layout={sceneLayout}
          layoutId={sceneLayoutRow?.id ?? null}
          placements={scenePlacements}
          structures={sceneStructures}
          nestedChildren={sceneNestedChildren}
          spaceColor={location.colorHex}
          onStructureSelect={(structure) => router.push(`/app/space/${location.id}/structure/create?edit=${structure.id}`)}
        />

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <ContentList title="안에 있는 공간" empty="아직 안에 만든 공간이 없습니다." hasContent={children.length > 0}>
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/app/space/${child.id}`}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold transition hover:bg-violet-50"
              >
                <Box size={16} />
                {child.name}
              </Link>
            ))}
          </ContentList>

          <ContentList title="이 공간의 물건" empty="이 공간에 직접 보관된 물건이 없습니다." hasContent={directItems.length > 0}>
            {directItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Package size={16} className="text-sky-700" />
                  {item.title}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">수량: {item.quantity} · 단위: {item.unit || '없음'}</span>
                  <Link
                    href={`/app/items?edit=${item.id}`}
                    className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-violet-100 hover:text-violet-700"
                    aria-label={`${item.title} 수정`}
                    title="물건 수정"
                  >
                    <Pencil size={15} />
                  </Link>
                  <Link
                    href={`/app/archive?item=${item.id}`}
                    className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-violet-100 hover:text-violet-700"
                    aria-label={`${item.title} 기록 보기`}
                    title="변경 기록"
                  >
                    <History size={15} />
                  </Link>
                  <DeleteItemButton itemId={item.id} itemName={item.title} />
                </span>
              </div>
            ))}
          </ContentList>

          <ContentList title="이 공간의 벽·창문" empty="이 공간에 만든 벽이나 창문이 없습니다." hasContent={sceneStructures.length > 0}>
            {sceneStructures.map((structure) => (
              <Link key={structure.id} href={`/app/space/${location.id}/structure/create?edit=${structure.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-violet-50">
                <span className="flex min-w-0 items-center gap-2 font-bold">
                  <Construction size={16} className={structure.kind === 'window' ? 'text-sky-700' : 'text-stone-700'} />
                  {structure.name}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Pencil size={14} /> {structure.kind === 'window' ? '창문 수정' : '벽 수정'}</span>
              </Link>
            ))}
          </ContentList>
        </section>

        <DeleteSpaceButton
          locationId={location.id}
          locationName={location.name}
          childCount={children.length}
          itemCount={directItems.length}
        />
      </section>
    </main>
  )
}

function getNestedChildren(
  directChildren: Array<{ id: string }>,
  spaces: ReturnType<typeof useSupabaseInventory>['spaces'],
  layouts: SceneLayout[],
  placements: ReturnType<typeof useSupabaseInventory>['placements'],
): SceneNestedChild[] {
  const directChildIds = new Set(directChildren.map((child) => child.id))
  const layoutsByOwner = new Map(layouts
    .filter((layout) => layout.sceneLocationId && directChildIds.has(layout.sceneLocationId))
    .map((layout) => [layout.id, layout.sceneLocationId]))
  const spacesById = new Map(spaces.map((space) => [space.id, space]))

  return placements.flatMap((placement) => {
    const parentId = layoutsByOwner.get(placement.layoutId)
    const child = spacesById.get(placement.locationId)
    if (!parentId || !child || child.parentId !== parentId) {
      return []
    }

    return [{
      ...placement,
      parentId,
      name: child.name,
      isPanelVisible: child.isPanelVisible !== false,
      colorHex: child.colorHex,
    }]
  })
}

function getSiblingPlacements({
  locationId,
  parentId,
  spaces,
  placements,
  structures,
  parentLayout,
}: {
  locationId: string
  parentId: string | null
  spaces: ReturnType<typeof useSupabaseInventory>['spaces']
  placements: ReturnType<typeof useSupabaseInventory>['placements']
  structures: ReturnType<typeof useSupabaseInventory>['structures']
  parentLayout: SceneLayout | HomeLayout | null
}): SceneSiblingPlacement[] {
  if (!parentLayout) {
    return []
  }

  const siblings = spaces.filter((space) => space.parentId === parentId && space.id !== locationId)
  const namesById = new Map(siblings.map((space) => [space.id, space.name]))
  const siblingSpaces = placements.flatMap((placement) => {
    const name = namesById.get(placement.locationId)
    return name && placement.layoutId === parentLayout.id
      ? [{ ...placement, name, kind: 'space' as const }]
      : []
  })
  const siblingStructures = structures
    .filter((structure) => structure.layoutId === parentLayout.id)
    .map((structure) => ({
      ...structure,
      locationId: structure.id,
      name: `${structure.kind === 'window' ? '창문' : '벽'} · ${structure.name}`,
    }))

  return [...siblingSpaces, ...siblingStructures]
}

function toSceneLayout(layout: SceneLayout | HomeLayout | null): SceneLayoutData | null {
  return layout
    ? { widthCm: layout.widthCm, heightCm: layout.heightCm, depthCm: layout.depthCm }
    : null
}

function SpacePathNavigation({ path }: { path: Array<{ id: string; name: string; parentId: string | null }> }) {
  return (
    <nav aria-label="현재 공간 경로" className="mt-4 flex flex-wrap items-center gap-1 rounded-xl border border-violet-100 bg-white p-2 shadow-sm">
      <Link href="/app/space" className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">
        <House size={15} />
        우리 집
      </Link>
      {path.map((space, index) => {
        const isCurrentSpace = index === path.length - 1
        return (
          <div key={space.id} className="flex items-center gap-1">
            <ChevronRight size={15} className="text-slate-300" />
            {isCurrentSpace ? (
              <span aria-current="page" className="rounded-xl bg-violet-600 px-2.5 py-1.5 text-sm font-semibold text-white">{space.name}</span>
            ) : (
              <Link href={`/app/space/${space.id}`} className="rounded-xl px-2.5 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">{space.name}</Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function ContentList({ title, empty, hasContent, children }: { title: string; empty: string; hasContent: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 space-y-2">{hasContent ? children : <p className="text-sm text-slate-500">{empty}</p>}</div>
    </div>
  )
}

function SpaceDetailLoading() {
  return (
    <main className="min-h-dvh bg-[#f5f8fd] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-5xl animate-pulse rounded-xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500">
        공간 데이터를 불러오는 중입니다.
      </section>
    </main>
  )
}

function getSpacePath(currentId: string, spaces: ReturnType<typeof useSupabaseInventory>['spaces']) {
  const spacesById = new Map(spaces.map((space) => [space.id, space]))
  const path: ReturnType<typeof useSupabaseInventory>['spaces'] = []
  let nextId: string | null = currentId

  const visited = new Set<string>()
  while (nextId && !visited.has(nextId)) {
    visited.add(nextId)
    const currentSpace = spacesById.get(nextId)
    if (!currentSpace) break
    path.unshift(currentSpace)
    nextId = currentSpace.parentId
  }

  return path
}
