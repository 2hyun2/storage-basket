'use client'

import { Edges, OrbitControls, Text } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { RectangularGrid } from '@/components/space/space-overview-3d'
import { getDefaultSpaceColor } from '@/lib/space/colors'
import { invalidateHomeInventory, useSupabaseInventory } from '@/lib/space/use-supabase-inventory'
import { createClient } from '@/lib/supabase/client'

export type SceneLayoutData = {
  widthCm: number
  heightCm: number
  depthCm: number
  colorHex?: string
}

export type ScenePlacementData = {
  id: string
  locationId: string
  xCm: number
  yCm: number
  zCm: number
  widthCm: number
  heightCm: number
  depthCm: number
}

export type SceneSiblingPlacement = ScenePlacementData & {
  name: string
  kind?: 'space' | 'wall' | 'window'
}

export type SceneStructureData = {
  id: string
  kind: 'wall' | 'window'
  name: string
  colorHex?: string
  isLabelVisible?: boolean
  xCm: number
  yCm: number
  zCm: number
  widthCm: number
  heightCm: number
  depthCm: number
}

type ChildSpace = {
  id: string
  name: string
  is_panel_visible?: boolean
  colorHex?: string
}

export type SceneNestedChild = ScenePlacementData & {
  parentId: string
  name: string
  isPanelVisible: boolean
  colorHex?: string
}

type DirectItem = {
  title: string
  quantity: number
  unit: string | null
}

const centimetresToScene = 0.01
const defaultSceneHeightCm = 100
const dragDistanceThreshold = 6

function toSceneCenter({
  xCm,
  elevationCm,
  planYCm,
  widthCm,
  heightCm,
  depthCm,
}: {
  xCm: number
  elevationCm: number
  planYCm: number
  widthCm: number
  heightCm: number
  depthCm: number
}): [number, number, number] {
  return [
    (xCm + widthCm / 2) * centimetresToScene,
    (elevationCm + heightCm / 2) * centimetresToScene,
    (planYCm + depthCm / 2) * centimetresToScene,
  ]
}

export function SpaceInterior3d({
  spaceName,
  childSpaces,
  items,
  layout,
  layoutId,
  placements,
  structures,
  nestedChildren = [],
  onStructureSelect,
  selectedStructureId,
  spaceColor,
  planOnly = false,
}: {
  spaceName: string
  childSpaces: ChildSpace[]
  items: DirectItem[]
  layout: SceneLayoutData | null
  layoutId: string | null
  placements: ScenePlacementData[]
  structures: SceneStructureData[]
  nestedChildren?: SceneNestedChild[]
  onStructureSelect?: (structure: SceneStructureData) => void
  selectedStructureId?: string | null
  spaceColor?: string
  planOnly?: boolean
}) {
  const sceneLayout = layout ?? {
    widthCm: 450,
    heightCm: 240,
    depthCm: 300,
  }
  const sceneWidth = sceneLayout.widthCm * centimetresToScene
  const sceneDepth = sceneLayout.depthCm * centimetresToScene
  // 내부 공간은 물건·하위 공간의 차이를 바로 읽을 수 있도록 가까운 상단 시점에서 연다.
  const cameraHeight = Math.max(sceneWidth, sceneDepth) * 1.45
  const placedChildSpaces = childSpaces.flatMap((child) => {
    const placement = placements.find((entry) => entry.locationId === child.id)
    return placement ? [{ child, placement }] : []
  })
  const unplacedSpaces = childSpaces.filter((child) => !placements.some((placement) => placement.locationId === child.id))
  const [editingSpace, setEditingSpace] = useState<ChildSpace | null>(null)
  const router = useRouter()

  return (
    <section className="mt-6 overflow-hidden border border-slate-200 bg-white shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
        <span>{spaceName} 3D 구조</span>
        <span className="text-violet-600">모든 치수는 cm · 블록을 클릭해 들어가기</span>
      </div>
      <div className="h-80">
        <Canvas
          camera={{
            position: [sceneWidth / 2, cameraHeight, sceneDepth / 2 + 0.01],
            fov: 42,
          }}
        >
          <color attach="background" args={['#f8fafc']} />
          <ambientLight intensity={1.35} />
          <directionalLight position={[4, 7, 4]} intensity={2.1} />
          <SceneFloor layout={sceneLayout} color={spaceColor} />
          {structures.map((structure) => (
            <SceneStructureMesh
              key={structure.id}
              structure={structure}
              isSelected={selectedStructureId === structure.id}
              planOnly={planOnly}
              onSelect={onStructureSelect ? () => onStructureSelect(structure) : undefined}
            />
          ))}
          {placedChildSpaces.map(({ child, placement }, index) => (
            <ChildSpaceBlock
              key={child.id}
              child={child}
              index={index}
              placement={placement}
              planOnly={planOnly}
              nestedChildren={nestedChildren.filter((nestedChild) => nestedChild.parentId === child.id)}
              onEnter={() => router.push(`/app/space/${child.id}`)}
              onEnterNested={(nestedChildId) => router.push(`/app/space/${nestedChildId}`)}
            />
          ))}
          <OrbitControls
            target={[sceneWidth / 2, 0, sceneDepth / 2]}
            enablePan={false}
            minDistance={3.5}
            maxDistance={11}
            minPolarAngle={0.08}
            maxPolarAngle={Math.PI / 2 - 0.08}
          />
        </Canvas>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
        집 구조 {structures.length}개 · 안에 있는 공간 {childSpaces.length}개
        {items.length > 0 && ` · 직접 보관: ${items.map((item) => `${item.title} ${item.quantity}${item.unit ?? ''}`).join(' · ')}`}
      </div>
      {unplacedSpaces.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-extrabold">아직 자리를 정하지 않은 공간</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unplacedSpaces.map((space) => <button key={space.id} type="button" onClick={() => setEditingSpace(space)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-violet-600">{space.name} · 자리 정하기</button>)}
          </div>
        </div>
      )}
      {editingSpace && (
        <PlacementEditor
          space={editingSpace}
          layoutId={layoutId}
          placement={placements.find((entry) => entry.locationId === editingSpace.id) ?? null}
          bounds={sceneLayout}
          siblingPlacements={[
            ...childSpaces
              .filter((child) => child.id !== editingSpace.id)
              .flatMap((child) => {
                const siblingPlacement = placements.find((entry) => entry.locationId === child.id)
                return siblingPlacement
                  ? [{ ...siblingPlacement, name: child.name, kind: 'space' as const }]
                  : []
              }),
            ...structures.map((structure) => ({
              ...structure,
              locationId: structure.id,
              name: `${structure.kind === 'window' ? '창문' : '벽'} · ${structure.name}`,
            })),
          ]}
          onClose={() => setEditingSpace(null)}
        />
      )}
    </section>
  )
}

function SceneFloor({ layout, color = '#8B5CF6' }: { layout: SceneLayoutData; color?: string }) {
  const width = layout.widthCm * centimetresToScene
  const depth = layout.depthCm * centimetresToScene
  const divisions = Math.max(8, Math.min(90, Math.round(Math.max(layout.widthCm, layout.depthCm) / 10)))

  return (
    <group>
      <mesh position={[width / 2, -0.08, depth / 2]} renderOrder={0}>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color={color} transparent opacity={0.28} />
      </mesh>
      <group position={[width / 2, -0.02, depth / 2]} renderOrder={1}>
        <RectangularGrid width={width} depth={depth} divisions={divisions} color={color} />
      </group>
    </group>
  )
}

function SceneStructureMesh({
  structure,
  isSelected,
  planOnly,
  onSelect,
}: {
  structure: SceneStructureData
  isSelected: boolean
  planOnly: boolean
  onSelect?: () => void
}) {
  const width = structure.widthCm * centimetresToScene
  // 벽·창문은 아직 개별 높이 입력을 제공하지 않는다.
  // 과거에 서로 다르게 저장된 자동값 대신 공통 기본 높이로 렌더링한다.
  const renderedHeightCm = planOnly ? 4 : defaultSceneHeightCm
  const height = renderedHeightCm * centimetresToScene
  const depth = structure.depthCm * centimetresToScene
  const defaultColor = {
    wall: '#c4b5fd',
    window: '#38bdf8',
  }[structure.kind]
  const color = structure.colorHex ?? defaultColor

  return (
    <group
      position={toSceneCenter({
        xCm: structure.xCm,
        elevationCm: planOnly ? 0 : structure.yCm,
        planYCm: structure.zCm,
        widthCm: structure.widthCm,
        heightCm: renderedHeightCm,
        depthCm: structure.depthCm,
      })}
    >
      <mesh
        onClick={(event) => {
          if (event.delta > dragDistanceThreshold) {
            return
          }

          onSelect?.()
        }}
        onPointerEnter={onSelect ? (event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        } : undefined}
        onPointerLeave={onSelect ? () => {
          document.body.style.cursor = 'auto'
        } : undefined}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} transparent opacity={isSelected ? 0.85 : 0.62} />
        <Edges color={isSelected ? '#7c3aed' : '#e2e8f0'} threshold={15} />
      </mesh>
      {structure.isLabelVisible !== false && (
        <SceneLabel
          name={structure.name}
          position={[0, height / 2 + 0.08, 0]}
          fontSize={0.1}
        />
      )}
    </group>
  )
}

function ChildSpaceBlock({
  child,
  index,
  placement,
  planOnly,
  nestedChildren,
  onEnter,
  onEnterNested,
}: {
  child: ChildSpace
  index: number
  placement: ScenePlacementData
  planOnly: boolean
  nestedChildren: SceneNestedChild[]
  onEnter: () => void
  onEnterNested: (nestedChildId: string) => void
}) {
  const widthCm = placement.widthCm
  const heightCm = planOnly ? 4 : placement.heightCm
  const depthCm = placement.depthCm
  const xCm = placement.xCm
  const yCm = planOnly ? 0 : placement.yCm
  const zCm = placement.zCm
  const color = child.colorHex ?? getDefaultSpaceColor(index)

  return (
    <group position={toSceneCenter({
      xCm,
      elevationCm: yCm,
      planYCm: zCm,
      widthCm,
      heightCm,
      depthCm,
    })}>
      <mesh
        onClick={(event) => {
          if (event.delta > dragDistanceThreshold) {
            return
          }

          onEnter()
        }}
        onPointerEnter={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = 'auto' }}
      >
        <boxGeometry args={[widthCm * centimetresToScene, heightCm * centimetresToScene, depthCm * centimetresToScene]} />
        <meshStandardMaterial color={color} transparent opacity={0.74} roughness={0.38} />
        <Edges color="#f5f3ff" threshold={15} />
      </mesh>
      {nestedChildren.map((nestedChild, nestedIndex) => (
        <NestedSpaceBlock
          key={nestedChild.id}
          nestedChild={nestedChild}
          parentWidthCm={widthCm}
          parentHeightCm={heightCm}
          parentDepthCm={depthCm}
          color={nestedChild.colorHex ?? getDefaultSpaceColor(index + nestedIndex + 1)}
          onEnter={() => onEnterNested(nestedChild.locationId)}
        />
      ))}
      {child.is_panel_visible !== false && (
        <SceneLabel
          name={child.name}
          position={[0, heightCm * centimetresToScene / 2 + 0.1, 0]}
        />
      )}
    </group>
  )
}

function NestedSpaceBlock({
  nestedChild,
  parentWidthCm,
  parentHeightCm,
  parentDepthCm,
  color,
  onEnter,
}: {
  nestedChild: SceneNestedChild
  parentWidthCm: number
  parentHeightCm: number
  parentDepthCm: number
  color: string
  onEnter: () => void
}) {
  const width = nestedChild.widthCm * centimetresToScene
  const depth = nestedChild.depthCm * centimetresToScene
  const parentWidth = parentWidthCm * centimetresToScene
  const parentDepth = parentDepthCm * centimetresToScene
  const parentHeight = parentHeightCm * centimetresToScene

  return (
    <group
      position={[
        (nestedChild.xCm + nestedChild.widthCm / 2) * centimetresToScene - parentWidth / 2,
        -parentHeight / 2 + 0.035,
        (nestedChild.zCm + nestedChild.depthCm / 2) * centimetresToScene - parentDepth / 2,
      ]}
    >
      <mesh
        onClick={(event) => {
          if (event.delta > dragDistanceThreshold) {
            return
          }

          onEnter()
        }}
        onPointerEnter={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = 'auto' }}
      >
        <boxGeometry args={[width, 0.06, depth]} />
        <meshStandardMaterial color={color} transparent opacity={0.88} />
        <Edges color="#ffffff" threshold={15} />
      </mesh>
      {nestedChild.isPanelVisible && (
        <SceneLabel name={nestedChild.name} position={[0, 0.09, 0]} fontSize={0.09} />
      )}
    </group>
  )
}

function SceneLabel({
  name,
  position,
  fontSize = 0.13,
}: {
  name: string
  position: [number, number, number]
  fontSize?: number
}) {
  const horizontalPadding = fontSize * 1.5
  const width = Math.max(
    fontSize * 1.8,
    Math.min(2.4, name.length * fontSize * 1.08 + horizontalPadding),
  )
  const height = fontSize * 2.2

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.88} />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={fontSize}
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        maxWidth={width - horizontalPadding}
      >
        {name}
      </Text>
    </group>
  )
}

export function PlacementEditor({
  space,
  layoutId,
  placement,
  bounds,
  siblingPlacements = [],
  onClose,
}: {
  space: ChildSpace
  layoutId: string | null
  placement: ScenePlacementData | null
  bounds: SceneLayoutData | null
  siblingPlacements?: SceneSiblingPlacement[]
  onClose: () => void
}) {
  const [message, setMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const {
    homeId,
    layouts,
    placements: allPlacements,
    structures: allStructures,
  } = useSupabaseInventory()
  const [draft, setDraft] = useState({
    x: placement?.xCm ?? 0,
    y: placement?.zCm ?? 0,
    z: placement?.yCm ?? 0,
    width: placement?.widthCm ?? 100,
    height: placement?.heightCm ?? 100,
    depth: placement?.depthCm ?? 80,
  })
  const [isDuplex, setIsDuplex] = useState((placement?.yCm ?? 0) > 0)
  const overlappingSibling = siblingPlacements.find((sibling) => rectanglesOverlap(
    { x: draft.x, y: draft.y, width: draft.width, height: draft.depth },
    { x: sibling.xCm, y: sibling.zCm, width: sibling.widthCm, height: sibling.depthCm },
  ))
  const availableXRanges = getAvailableCoordinateRanges({
    axis: 'x',
    draft,
    bounds,
    siblings: siblingPlacements,
  })
  const availableYRanges = getAvailableCoordinateRanges({
    axis: 'y',
    draft,
    bounds,
    siblings: siblingPlacements,
  })
  const wallDistances = bounds ? {
    left: Math.max(0, draft.x),
    right: Math.max(0, bounds.widthCm - (draft.x + draft.width)),
    top: Math.max(0, draft.y),
    bottom: Math.max(0, bounds.depthCm - (draft.y + draft.depth)),
  } : null
  const ownSceneLayout = layouts.find((entry) => entry.sceneLocationId === space.id) ?? null
  const ownSceneContent = ownSceneLayout
    ? [
        ...allPlacements.filter((entry) => entry.layoutId === ownSceneLayout.id),
        ...allStructures.filter((entry) => entry.layoutId === ownSceneLayout.id),
      ]
    : []

  async function removePlacement() {
    if (!placement || !window.confirm(`“${space.name}”의 3D 자리만 지울까요?\n공간 이름과 안의 물건은 그대로 남습니다.`)) {
      return
    }

    setMessage(null)
    const { error } = await createClient()
      .from('space_placements')
      .delete()
      .eq('id', placement.id)

    if (error) {
      setMessage(error.message)
      return
    }

    await invalidateHomeInventory(queryClient)
    onClose()
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!layoutId || !homeId) {
      setMessage('이 공간의 3D 장면을 먼저 만들어야 합니다.')
      return
    }

    const numbers = [draft.x, draft.y, draft.z, draft.width, draft.height, draft.depth]
    if (numbers.some((value) => !Number.isInteger(value) || value < 0) || numbers.slice(3).some((value) => value < 1)) {
      setMessage('모든 값은 정수 cm여야 합니다.')
      return
    }

    if (bounds && (
      draft.x + draft.width > bounds.widthCm ||
      draft.y + draft.depth > bounds.depthCm ||
      (isDuplex && draft.z + draft.height > bounds.heightCm)
    )) {
      setMessage('이 공간 안에 들어오도록 위치와 크기를 조정해 주세요.')
      return
    }

    if (overlappingSibling) {
      setMessage(`“${overlappingSibling.name}”과 겹칩니다. 격자에서 비어 있는 곳을 선택해 주세요.`)
      return
    }

    const outOfBoundsOwnContent = ownSceneContent.find((entry) => (
      entry.xCm + entry.widthCm > draft.width ||
      entry.zCm + entry.depthCm > draft.depth ||
      entry.yCm + entry.heightCm > draft.height
    ))
    if (outOfBoundsOwnContent) {
      setMessage('이 공간 안에 이미 배치된 공간 또는 벽·창문이 새 크기를 벗어납니다. 먼저 내부 배치를 조정해 주세요.')
      return
    }

    const payload = {
      layout_id: layoutId,
      location_id: space.id,
      x_cm: draft.x,
      y_cm: isDuplex ? draft.z : 0,
      z_cm: draft.y,
      width_cm: draft.width,
      height_cm: draft.height,
      depth_cm: draft.depth,
    }
    const supabase = createClient()
    const query = placement
      ? supabase.from('space_placements').update(payload).eq('id', placement.id)
      : supabase.from('space_placements').insert(payload)
    const { error } = await query
    if (error) {
      setMessage(error.message)
      return
    }

    const { error: layoutError } = await supabase
      .from('space_layouts')
      .upsert({
        home_id: homeId,
        scene_location_id: space.id,
        layout_key: `location:${space.id}`,
        view_kind: 'interior',
        width_cm: draft.width,
        height_cm: draft.height,
        depth_cm: draft.depth,
      }, { onConflict: 'home_id,layout_key' })
    if (layoutError) {
      setMessage(layoutError.message)
      return
    }

    await invalidateHomeInventory(queryClient)
    onClose()
  }

  const fields = [
    ['x', '좌표 X', bounds ? Math.max(0, bounds.widthCm - draft.width) : undefined],
    ['y', '좌표 Y', bounds ? Math.max(0, bounds.depthCm - draft.depth) : undefined],
    ['width', '가로 X', bounds?.widthCm],
    ['depth', '세로 Y', bounds?.depthCm],
  ] as const

  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/80 p-4">
      <form onSubmit={save} className="w-full max-w-md rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold">{space.name} 3D 자리 정하기</h3>
          <button type="button" onClick={onClose} className="text-sm font-bold text-slate-500">닫기</button>
        </div>
        <PlanPlacementCanvas
          draft={{
            x: draft.x,
            y: draft.y,
            width: draft.width,
            depth: draft.depth,
          }}
          bounds={bounds}
          siblings={siblingPlacements}
          isOverlapping={Boolean(overlappingSibling)}
          onChange={(next) => setDraft({
            ...draft,
            x: next.x,
            y: next.y,
            width: next.width,
            depth: next.depth,
          })}
        />
        <p className="mt-3 text-xs font-bold text-slate-600">회색은 기존 공간, 보라·파랑은 벽·창문입니다. 연한 빨강은 현재 크기로 시작하면 겹치는 영역입니다.</p>
        <div className="mt-2 grid gap-1 border-l-2 border-violet-300 bg-violet-50 px-2 py-2 text-xs leading-5 text-violet-950">
          <p><strong>현재 Y에서 가능한 X:</strong> {formatCoordinateRanges(availableXRanges)}</p>
          <p><strong>현재 X에서 가능한 Y:</strong> {formatCoordinateRanges(availableYRanges)}</p>
          {wallDistances && <p><strong>현재 배치에서 벽까지:</strong> 왼쪽 {wallDistances.left}cm · 오른쪽 {wallDistances.right}cm · 위 {wallDistances.top}cm · 아래 {wallDistances.bottom}cm</p>}
        </div>
        <p className="mt-2 text-xs font-bold text-slate-600">드래그 결과는 아래에서 1cm 단위 정밀 조정</p>
        <div className="mt-2 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <p className="col-span-2 text-xs font-extrabold text-slate-700">시작 위치 · X는 왼쪽→오른쪽, Y는 위쪽→아래쪽</p>
            {fields.slice(0, 2).map(([key, label, max]) => (
              <NumberInput key={key} label={`${label} · 최대 ${max ?? '?'}cm`} min={0} max={max} value={draft[key]} onChange={(value) => setDraft({ ...draft, [key]: value })} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <p className="col-span-2 text-xs font-extrabold text-slate-700">공간 크기 · 가로는 X, 세로는 Y</p>
            {fields.slice(2).map(([key, label, max]) => (
              <NumberInput key={key} label={`${label} · 최대 ${max ?? '?'}cm`} min={1} max={max} value={draft[key]} onChange={(value) => setDraft({ ...draft, [key]: value })} />
            ))}
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs font-bold">
          <input type="checkbox" checked={isDuplex} onChange={(event) => { setIsDuplex(event.target.checked); if (!event.target.checked) setDraft({ ...draft, z: 0 }) }} />
          복층 구조입니다
        </label>
        {isDuplex && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberInput label={`공간 높이 · 최대 ${bounds?.heightCm ?? '?'}cm`} min={1} max={bounds?.heightCm} value={draft.height} onChange={(height) => setDraft({ ...draft, height })} />
            <NumberInput label={`층 위치 Z · 최대 ${bounds ? Math.max(0, bounds.heightCm - draft.height) : '?'}cm`} min={0} max={bounds ? Math.max(0, bounds.heightCm - draft.height) : undefined} value={draft.z} onChange={(z) => setDraft({ ...draft, z })} />
          </div>
        )}
        {overlappingSibling && <p className="mt-2 text-xs font-bold text-rose-700">현재 위치는 “{overlappingSibling.name}”과 겹칩니다.</p>}
        {message && <p className="mt-2 text-xs font-bold text-rose-700">{message}</p>}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {placement && (
            <button
              type="button"
              onClick={() => void removePlacement()}
              className="rounded-xl border border-rose-200 bg-white py-2 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50"
            >
              3D 배치 지우기
            </button>
          )}
          <button className="rounded-xl bg-violet-600 py-2 text-sm font-extrabold text-white">
            저장
          </button>
        </div>
      </form>
    </div>
  )
}

function NumberInput({ label, min, max, value, onChange }: { label: string; min: number; max?: number; value: number; onChange: (value: number) => void }) {
  return <label className="text-xs font-bold">{label}<input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5" /></label>
}

export type PlanPlacementDraft = {
  x: number
  y: number
  width: number
  depth: number
}

export function PlanPlacementCanvas({
  draft,
  bounds,
  siblings,
  isOverlapping,
  onChange,
}: {
  draft: PlanPlacementDraft
  bounds: SceneLayoutData | null
  siblings: SceneSiblingPlacement[]
  isOverlapping: boolean
  onChange: (draft: PlanPlacementDraft) => void
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const widthCm = bounds?.widthCm ?? 600
  const depthCm = bounds?.depthCm ?? 400
  const gridStepCm = 10
  const xTicks = getRulerTicks(widthCm)
  const yTicks = getRulerTicks(depthCm)

  function point(event: PointerEvent<HTMLDivElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()

    return {
      x: Math.max(0, Math.round((event.clientX - rect.left) / rect.width * widthCm)),
      y: Math.max(0, Math.round((event.clientY - rect.top) / rect.height * depthCm)),
    }
  }

  function start(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    startRef.current = point(event)
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    if (!startRef.current) {
      return
    }

    const next = point(event)
    const x = Math.min(startRef.current.x, next.x)
    const y = Math.min(startRef.current.y, next.y)

    onChange({
      ...draft,
      x,
      y,
      width: Math.max(1, Math.abs(next.x - startRef.current.x)),
      depth: Math.max(1, Math.abs(next.y - startRef.current.y)),
    })
    startRef.current = null
  }

  return (
    <div className="mt-4 grid grid-cols-[1.75rem_minmax(0,1fr)] grid-rows-[1.25rem_auto]">
      <div className="border-b border-r border-violet-200 bg-violet-50 text-center text-[9px] font-extrabold leading-5 text-violet-800">
        cm
      </div>
      <div className="pointer-events-none relative border-b border-violet-200 bg-violet-50">
        <span className="absolute left-1 top-0.5 text-[9px] font-extrabold text-violet-800">X →</span>
        {xTicks.map((value) => (
          <div
            key={`x-${value}`}
            style={{ left: `${value / widthCm * 100}%` }}
            className="absolute top-0 h-full -translate-x-1/2"
          >
            <span className="absolute top-0.5 -translate-x-1/2 text-[9px] font-bold text-violet-800">
              {value}
            </span>
            <span className="absolute bottom-0 h-1.5 border-l border-violet-400" />
          </div>
        ))}
      </div>
      <div className="pointer-events-none relative border-r border-violet-200 bg-violet-50">
        <span className="absolute left-1 top-1 text-[9px] font-extrabold text-violet-800">Y</span>
        {yTicks.map((value) => (
          <div
            key={`y-${value}`}
            style={{ top: `${value / depthCm * 100}%` }}
            className="absolute left-0 w-full -translate-y-1/2"
          >
            <span className="absolute left-0.5 -translate-y-1/2 text-[9px] font-bold text-violet-800">
              {value}
            </span>
            <span className="absolute right-0 top-0 w-1.5 border-t border-violet-400" />
          </div>
        ))}
      </div>
      <div
        ref={canvasRef}
        onPointerDown={start}
        onPointerUp={end}
        style={{
          aspectRatio: `${widthCm} / ${depthCm}`,
          backgroundSize: `${gridStepCm / widthCm * 100}% ${gridStepCm / depthCm * 100}%`,
        }}
        className="relative w-full cursor-crosshair overflow-hidden border border-violet-200 bg-[linear-gradient(#ede9fe_1px,transparent_1px),linear-gradient(90deg,#ede9fe_1px,transparent_1px)]"
      >
      {siblings.map((sibling) => {
        const blockedLeft = Math.max(0, sibling.xCm - draft.width)
        const blockedTop = Math.max(0, sibling.zCm - draft.depth)
        const blockedRight = Math.min(widthCm, sibling.xCm + sibling.widthCm)
        const blockedBottom = Math.min(depthCm, sibling.zCm + sibling.depthCm)

        return (
          <div
            key={`${sibling.id}-blocked`}
            style={{
              left: `${blockedLeft / widthCm * 100}%`,
              top: `${blockedTop / depthCm * 100}%`,
              width: `${Math.max(0, blockedRight - blockedLeft) / widthCm * 100}%`,
              height: `${Math.max(0, blockedBottom - blockedTop) / depthCm * 100}%`,
            }}
            className="pointer-events-none absolute border border-rose-300/70 bg-rose-300/20"
          />
        )
      })}
      {siblings.map((sibling) => (
        <div
          key={sibling.id}
          style={{
            left: `${sibling.xCm / widthCm * 100}%`,
            top: `${sibling.zCm / depthCm * 100}%`,
            width: `${sibling.widthCm / widthCm * 100}%`,
            height: `${sibling.depthCm / depthCm * 100}%`,
          }}
          className={`pointer-events-none absolute grid place-items-center border-2 px-1 text-center text-[10px] font-extrabold ${sibling.kind === 'window' ? 'border-sky-600 bg-sky-300/50 text-sky-950' : sibling.kind === 'wall' ? 'border-stone-500 bg-stone-300/45 text-stone-800' : 'border-slate-500 bg-slate-400/35 text-slate-700'}`}
        >
          <span className="max-w-full truncate">{sibling.name}</span>
        </div>
      ))}
      <div style={{ left: `${draft.x / widthCm * 100}%`, top: `${draft.y / depthCm * 100}%`, width: `${draft.width / widthCm * 100}%`, height: `${draft.depth / depthCm * 100}%` }} className={`pointer-events-none absolute border-2 ${isOverlapping ? 'border-rose-600 bg-rose-500/30' : 'border-violet-600 bg-violet-500/30'}`} />
      </div>
    </div>
  )
}

function getRulerTicks(maximumCm: number) {
  const stepCm = maximumCm <= 150
    ? 10
    : maximumCm <= 300
      ? 25
      : maximumCm <= 700
        ? 50
        : 100
  const ticks: number[] = []

  for (let value = 0; value <= maximumCm; value += stepCm) {
    ticks.push(value)
  }

  if (ticks.at(-1) !== maximumCm) {
    ticks.push(maximumCm)
  }

  return ticks
}

export function rectanglesOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
) {
  return first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
}

type DraftRectangle = {
  x: number
  y: number
  width: number
  height: number
  depth: number
}

function getAvailableCoordinateRanges({
  axis,
  draft,
  bounds,
  siblings,
}: {
  axis: 'x' | 'y'
  draft: DraftRectangle
  bounds: SceneLayoutData | null
  siblings: SceneSiblingPlacement[]
}) {
  if (!bounds) {
    return []
  }

  const maximum = axis === 'x'
    ? Math.max(0, bounds.widthCm - draft.width)
    : Math.max(0, bounds.depthCm - draft.depth)
  let ranges: Array<[number, number]> = [[0, maximum]]

  for (const sibling of siblings) {
    const intersectsOtherAxis = axis === 'x'
      ? draft.y < sibling.zCm + sibling.depthCm && draft.y + draft.depth > sibling.zCm
      : draft.x < sibling.xCm + sibling.widthCm && draft.x + draft.width > sibling.xCm

    if (!intersectsOtherAxis) {
      continue
    }

    const blockedStart = axis === 'x'
      ? sibling.xCm - draft.width + 1
      : sibling.zCm - draft.depth + 1
    const blockedEnd = axis === 'x'
      ? sibling.xCm + sibling.widthCm - 1
      : sibling.zCm + sibling.depthCm - 1
    ranges = subtractBlockedRange(ranges, blockedStart, blockedEnd)
  }

  return ranges
}

function subtractBlockedRange(ranges: Array<[number, number]>, blockedStart: number, blockedEnd: number) {
  return ranges.flatMap(([start, end]) => {
    if (blockedEnd < start || blockedStart > end) {
      return [[start, end] as [number, number]]
    }

    const nextRanges: Array<[number, number]> = []
    if (blockedStart > start) {
      nextRanges.push([start, blockedStart - 1])
    }
    if (blockedEnd < end) {
      nextRanges.push([blockedEnd + 1, end])
    }
    return nextRanges
  })
}

function formatCoordinateRanges(ranges: Array<[number, number]>) {
  if (ranges.length === 0) {
    return '없음'
  }

  return ranges.map(([start, end]) => start === end ? `${start}cm` : `${start}–${end}cm`).join(' · ')
}
