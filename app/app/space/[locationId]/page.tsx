import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Box, ChevronRight, Construction, House, Package, Plus } from 'lucide-react'
import {
  type SceneLayoutData,
  type ScenePlacementData,
  type SceneSiblingPlacement,
  type SceneStructureData,
  SpaceInterior3d,
} from '@/components/space/space-interior-3d'
import { DrawPlacementDialog } from '@/components/space/draw-placement-dialog'
import { DeleteItemButton } from '@/components/space/delete-item-button'
import { DeleteSpaceButton } from '@/components/space/delete-space-button'
import { SpacePanelVisibilityButton } from '@/components/space/space-panel-visibility-button'
import { createClient } from '@/lib/supabase/server'

type SpaceNode = {
  id: string
  name: string
  parent_id: string | null
}

type LayoutRow = {
  id: string
  width_cm: number
  height_cm: number
  depth_cm: number
}

export default async function SpaceLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>
  searchParams: Promise<{ draw?: string }>
}) {
  const { locationId } = await params
  const { draw } = await searchParams
  const supabase = await createClient()
  const { data: location } = await supabase
    .from('locations')
    .select('id, name, parent_id, home_id, is_panel_visible')
    .eq('id', locationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!location) {
    notFound()
  }

  const [allSpacesResult, childrenResult, itemsResult] = await Promise.all([
    supabase
      .from('locations')
      .select('id, name, parent_id')
      .eq('home_id', location.home_id)
      .is('deleted_at', null),
    supabase
      .from('locations')
      .select('id, name, is_panel_visible')
      .eq('parent_id', location.id)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('items')
      .select('id, title, quantity, unit')
      .eq('location_id', location.id)
      .is('deleted_at', null)
      .order('title'),
  ])

  const spacePath = getSpacePath(location.id, allSpacesResult.data ?? [])
  const { data: sceneLayoutRow } = await supabase
    .from('space_layouts')
    .select('id, width_cm, height_cm, depth_cm')
    .eq('scene_location_id', location.id)
    .maybeSingle()

  const [placementsResult, structuresResult] = sceneLayoutRow
    ? await Promise.all([
        supabase
          .from('space_placements')
          .select('id, location_id, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm')
          .eq('layout_id', sceneLayoutRow.id),
        supabase
          .from('scene_structures')
          .select('id, kind, name, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm')
          .eq('layout_id', sceneLayoutRow.id),
      ])
    : [{ data: [] }, { data: [] }]

  const sceneLayout: SceneLayoutData | null = sceneLayoutRow
    ? {
        widthCm: Number(sceneLayoutRow.width_cm),
        heightCm: Number(sceneLayoutRow.height_cm),
        depthCm: Number(sceneLayoutRow.depth_cm),
      }
    : null
  const scenePlacements: ScenePlacementData[] = (placementsResult.data ?? []).map((placement) => ({
    id: placement.id,
    locationId: placement.location_id,
    xCm: Number(placement.x_cm),
    yCm: Number(placement.y_cm),
    zCm: Number(placement.z_cm),
    widthCm: Number(placement.width_cm),
    heightCm: Number(placement.height_cm),
    depthCm: Number(placement.depth_cm),
  }))
  const sceneStructures: SceneStructureData[] = (structuresResult.data ?? []).map((structure) => ({
    id: structure.id,
    kind: structure.kind as SceneStructureData['kind'],
    name: structure.name,
    xCm: Number(structure.x_cm),
    yCm: Number(structure.y_cm),
    zCm: Number(structure.z_cm),
    widthCm: Number(structure.width_cm),
    heightCm: Number(structure.height_cm),
    depthCm: Number(structure.depth_cm),
  }))
  let parentLayout: LayoutRow | null = null

  if (location.parent_id) {
    const { data: directParentLayout } = await supabase
      .from('space_layouts')
      .select('id, width_cm, height_cm, depth_cm')
      .eq('scene_location_id', location.parent_id)
      .maybeSingle()
    parentLayout = directParentLayout

    // Older text-only spaces may have a placement but no dedicated child scene yet.
    // Their already-saved size is sufficient to restore the missing scene record.
    if (!parentLayout) {
      const { data: parentPlacement } = await supabase
        .from('space_placements')
        .select('width_cm, height_cm, depth_cm')
        .eq('location_id', location.parent_id)
        .maybeSingle()

      if (parentPlacement) {
        const { data: restoredLayout } = await supabase
          .from('space_layouts')
          .upsert({
            home_id: location.home_id,
            scene_location_id: location.parent_id,
            layout_key: `location:${location.parent_id}`,
            view_kind: 'interior',
            width_cm: parentPlacement.width_cm,
            height_cm: parentPlacement.height_cm,
            depth_cm: parentPlacement.depth_cm,
          }, { onConflict: 'home_id,layout_key' })
          .select('id, width_cm, height_cm, depth_cm')
          .single()
        parentLayout = restoredLayout
      }
    }
  } else {
    const { data: homeLayout } = await supabase
      .from('space_layouts')
      .select('id, width_cm, height_cm, depth_cm')
      .eq('home_id', location.home_id)
      .eq('layout_key', 'home')
      .maybeSingle()
    parentLayout = homeLayout
  }
  const { data: ownPlacement } = parentLayout
    ? await supabase.from('space_placements').select('id, location_id, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm').eq('layout_id', parentLayout.id).eq('location_id', location.id).maybeSingle()
    : { data: null }
  const editablePlacement = ownPlacement ? { id: ownPlacement.id, locationId: ownPlacement.location_id, xCm: Number(ownPlacement.x_cm), yCm: Number(ownPlacement.y_cm), zCm: Number(ownPlacement.z_cm), widthCm: Number(ownPlacement.width_cm), heightCm: Number(ownPlacement.height_cm), depthCm: Number(ownPlacement.depth_cm) } : null

  const siblingLocationsQuery = supabase
    .from('locations')
    .select('id, name')
    .eq('home_id', location.home_id)
    .is('deleted_at', null)
  const siblingLocationsResult = location.parent_id
    ? await siblingLocationsQuery.eq('parent_id', location.parent_id)
    : await siblingLocationsQuery.is('parent_id', null)
  const siblingLocations = (siblingLocationsResult.data ?? []).filter((sibling) => sibling.id !== location.id)
  const siblingIds = siblingLocations.map((sibling) => sibling.id)
  const siblingPlacementsResult = parentLayout && siblingIds.length > 0
    ? await supabase
        .from('space_placements')
        .select('id, location_id, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm')
        .eq('layout_id', parentLayout.id)
        .in('location_id', siblingIds)
    : { data: [] }
  const parentStructuresResult = parentLayout
    ? await supabase
        .from('scene_structures')
        .select('id, kind, name, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm')
        .eq('layout_id', parentLayout.id)
    : { data: [] }
  const siblingNames = new Map(siblingLocations.map((sibling) => [sibling.id, sibling.name]))
  const siblingSpacePlacements: SceneSiblingPlacement[] = (siblingPlacementsResult.data ?? []).flatMap((placement) => {
    const name = siblingNames.get(placement.location_id)

    if (!name) {
      return []
    }

    return [{
      id: placement.id,
      locationId: placement.location_id,
      name,
      kind: 'space',
      xCm: Number(placement.x_cm),
      yCm: Number(placement.y_cm),
      zCm: Number(placement.z_cm),
      widthCm: Number(placement.width_cm),
      heightCm: Number(placement.height_cm),
      depthCm: Number(placement.depth_cm),
    }]
  })
  const siblingStructurePlacements: SceneSiblingPlacement[] = (parentStructuresResult.data ?? []).map((structure) => ({
    id: structure.id,
    locationId: structure.id,
    name: `${structure.kind === 'window' ? '창문' : '벽'} · ${structure.name}`,
    kind: structure.kind as 'wall' | 'window',
    xCm: Number(structure.x_cm),
    yCm: Number(structure.y_cm),
    zCm: Number(structure.z_cm),
    widthCm: Number(structure.width_cm),
    heightCm: Number(structure.height_cm),
    depthCm: Number(structure.depth_cm),
  }))
  const siblingPlacements = [...siblingSpacePlacements, ...siblingStructurePlacements]

  return (
    <main className="min-h-dvh bg-[#f8f7ff] px-2 py-4 text-slate-950 sm:px-4 sm:py-4">
      <section className="mx-auto max-w-5xl">
        <Link
          href={location.parent_id ? `/app/space/${location.parent_id}` : '/app/space'}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition hover:text-violet-700"
        >
          <ArrowLeft size={17} />
          상위 공간으로 돌아가기
        </Link>

        {draw === '1' && <DrawPlacementDialog locationId={location.id} name={location.name} layoutId={parentLayout?.id ?? null} placement={editablePlacement} bounds={parentLayout ? { widthCm: Number(parentLayout.width_cm), heightCm: Number(parentLayout.height_cm), depthCm: Number(parentLayout.depth_cm) } : null} siblingPlacements={siblingPlacements} />}

        <SpacePathNavigation path={spacePath} />

        <header className="mt-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700">
            <Box size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-violet-700">공간 상세</p>
            <h1 className="mt-1 text-3xl font-extrabold">{location.name}</h1>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/app/space/create?inside=${location.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-extrabold text-white transition hover:bg-violet-700"
          >
            <Plus size={16} />
            이 안에 공간 만들기
          </Link>
          <SpacePanelVisibilityButton
            locationId={location.id}
            initialVisibility={location.is_panel_visible}
          />
          <Link
            href={`/app/space/${location.id}/structure/create`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-extrabold text-violet-700 transition hover:bg-violet-50"
          >
            <Construction size={16} />
            벽·창문 설계
          </Link>
        </div>

        <section className="mt-4 grid gap-3 border border-slate-200 bg-white p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-extrabold text-slate-900">공간 정보</p>
            <p className="mt-1 leading-6 text-slate-500">
              {sceneLayout
                ? `3D 크기 ${sceneLayout.widthCm} × ${sceneLayout.depthCm}cm${sceneLayout.heightCm ? ` · 높이 ${sceneLayout.heightCm}cm` : ''}`
                : '아직 3D 자리와 크기를 정하지 않은 텍스트 공간입니다.'}
            </p>
          </div>
          <Link
            href={`/app/space/${location.id}?draw=1`}
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-3 py-2 text-sm font-extrabold text-white transition hover:bg-violet-700"
          >
            {editablePlacement ? '3D 자리 고치기' : '3D 자리 정하기'}
          </Link>
        </section>

        <SpaceInterior3d
            spaceName={location.name}
            childSpaces={childrenResult.data ?? []}
            items={(itemsResult.data ?? []).map((item) => ({
              title: item.title,
              quantity: Number(item.quantity),
              unit: item.unit,
            }))}
            layout={sceneLayout}
            layoutId={sceneLayoutRow?.id ?? null}
            placements={scenePlacements}
            structures={sceneStructures}
          />

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <ContentList title="안에 있는 공간" empty="아직 안에 만든 공간이 없습니다.">
            {childrenResult.data?.map((child) => (
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

          <ContentList title="이 공간의 물건" empty="이 공간에 직접 보관된 물건이 없습니다.">
            {itemsResult.data?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Package size={16} className="text-sky-700" />
                  {item.title}
                </span>
                <span className="flex items-center gap-2">
                  <strong>{item.quantity}{item.unit ?? ''}</strong>
                  <DeleteItemButton itemId={item.id} itemName={item.title} />
                </span>
              </div>
            ))}
          </ContentList>
        </section>

        <DeleteSpaceButton
          locationId={location.id}
          locationName={location.name}
          childCount={childrenResult.data?.length ?? 0}
          itemCount={itemsResult.data?.length ?? 0}
        />

      </section>
    </main>
  )
}

function SpacePathNavigation({ path }: { path: SpaceNode[] }) {
  return (
    <nav
      aria-label="현재 공간 경로"
      className="mt-5 flex flex-wrap items-center gap-1 rounded-2xl border border-violet-100 bg-white p-2 shadow-sm"
    >
      <Link
        href="/app/space"
        className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
      >
        <House size={15} />
        우리 집
      </Link>

      {path.map((space, index) => {
        const isCurrentSpace = index === path.length - 1

        return (
          <div key={space.id} className="flex items-center gap-1">
            <ChevronRight size={15} className="text-slate-300" />
            {isCurrentSpace ? (
              <span
                aria-current="page"
                className="rounded-xl bg-violet-600 px-2.5 py-1.5 text-sm font-extrabold text-white"
              >
                {space.name}
              </span>
            ) : (
              <Link
                href={`/app/space/${space.id}`}
                className="rounded-xl px-2.5 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
              >
                {space.name}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function ContentList({
  title,
  empty,
  children,
}: {
  title: string
  empty: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <h2 className="font-extrabold">{title}</h2>
      <div className="mt-4 space-y-2">
        {children || <p className="text-sm text-slate-500">{empty}</p>}
      </div>
    </div>
  )
}

function getSpacePath(currentId: string, spaces: SpaceNode[]) {
  const spacesById = new Map(spaces.map((space) => [space.id, space]))
  const path: SpaceNode[] = []
  let nextId: string | null = currentId

  while (nextId) {
    const currentSpace = spacesById.get(nextId)

    if (!currentSpace) {
      break
    }

    path.unshift(currentSpace)
    nextId = currentSpace.parent_id
  }

  return path
}
