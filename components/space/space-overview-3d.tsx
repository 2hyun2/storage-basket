'use client'

import { OrbitControls, Text } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useRouter } from 'next/navigation'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { useMemo } from 'react'
import type { LocalSpace } from '@/lib/space/local-spaces'
import { getDefaultSpaceColor } from '@/lib/space/colors'
import type {
  HomeLayout,
  SceneLayout,
  SceneStructure,
  SpacePlacement,
} from '@/lib/space/use-supabase-inventory'

type SpaceOverview3dProps = {
  spaces: LocalSpace[]
  homeLayout: HomeLayout | null
  layouts: SceneLayout[]
  placements: SpacePlacement[]
  structures?: SceneStructure[]
  compact?: boolean
}

type RoomLayout = {
  position: [number, number, number]
  width: number
  height: number
  depth: number
  color: string
}

type NestedRoomLayout = {
  position: [number, number, number]
  width: number
  height: number
  depth: number
  color: string
}

type StructureLayout = {
  id: string
  kind: 'wall' | 'window'
  name: string
  position: [number, number, number]
  width: number
  height: number
  depth: number
  color: string
  editHref: string | null
}

export function SpaceOverview3d({
  spaces,
  homeLayout,
  layouts = [],
  placements = [],
  structures = [],
  compact = false,
}: SpaceOverview3dProps) {
  const router = useRouter()
  const rootSpaces = spaces.filter((space) => space.parentId === null)
  const homeWidth = homeLayout ? homeLayout.widthCm * 0.01 : 9
  const homeDepth = homeLayout ? homeLayout.depthCm * 0.01 : 6
  // 처음에는 공간 이름과 내부 배치가 읽히는 가까운 상단 시점으로 시작한다.
  // 전체 평면도는 사용자가 마우스 휠로 한 단계 물러나 확인할 수 있다.
  const cameraHeight = Math.max(4, Math.max(homeWidth, homeDepth) * 1.05)
  const homePlacements = homeLayout
    ? placements.filter((placement) => placement.layoutId === homeLayout.id)
    : []
  const placedRootSpaces = rootSpaces.filter((space) => homePlacements.some((placement) => placement.locationId === space.id))
  const unplacedRootSpaces = rootSpaces.filter((space) => !homePlacements.some((placement) => placement.locationId === space.id))
  const homeStructures = homeLayout
    ? getStructureLayouts(homeLayout, structures)
    : []

  return (
    <div className={`mt-4 overflow-hidden border border-slate-200 bg-white ${compact ? '' : 'shadow-inner'}`}>
      {!compact && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
          <span>우리 집 배치도</span>
          <span className="text-violet-600">공간을 클릭해 내부로 이동</span>
        </div>
      )}
      <div className={compact ? 'h-72 sm:h-80' : 'h-96'}>
        <Canvas camera={{ position: [0, cameraHeight, 0.01], fov: 42 }}>
          <color attach="background" args={['#f8fafc']} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 8, 4]} intensity={2.5} />

          <HouseStructure homeLayout={homeLayout} />
          {homeStructures.map((structure) => (
            <StructureZone key={structure.id} structure={structure} />
          ))}
          {placedRootSpaces.map((space, index) => {
            const layout = getRoomLayout(space, index, homeLayout, homePlacements)
            if (!layout) return null

            const nestedSpaces = getNestedSpaces(space, spaces, layouts, placements, index)
            const nestedStructures = getNestedStructureLayouts(space, layouts, structures)

            return (
              <RoomZone
                key={space.id}
                space={space}
                layout={layout}
                nestedSpaces={nestedSpaces}
                nestedStructures={nestedStructures}
              />
            )
          })}

          <OrbitControls
            target={[0, 0, 0]}
            enablePan={false}
            minDistance={4}
            maxDistance={14}
            minPolarAngle={0.08}
            maxPolarAngle={Math.PI / 2 - 0.08}
          />
        </Canvas>
      </div>
      {unplacedRootSpaces.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p>아직 자리를 정하지 않은 공간</p>
          <div className="mt-2 flex flex-wrap gap-2">{unplacedRootSpaces.map((space) => <button key={space.id} type="button" onClick={() => router.push(`/app/space/${space.id}?draw=1`)} className="rounded-lg bg-violet-100 px-2 py-1 font-bold text-violet-700">{space.name} · 3D 자리 정하기</button>)}</div>
        </div>
      )}
    </div>
  )
}

function getRoomLayout(
  space: LocalSpace,
  index: number,
  homeLayout: HomeLayout | null,
  placements: SpacePlacement[],
) : RoomLayout | null {
  const placement = placements.find((entry) => entry.locationId === space.id)

  if (!homeLayout || !placement) {
    return null
  }

  const centimetresToScene = 0.01

  return {
    position: [
      (placement.xCm + placement.widthCm / 2 - homeLayout.widthCm / 2) * centimetresToScene,
      placement.yCm * centimetresToScene,
      (placement.zCm + placement.depthCm / 2 - homeLayout.depthCm / 2) * centimetresToScene,
    ] as [number, number, number],
    width: placement.widthCm * centimetresToScene,
    height: toSceneHeight(placement.heightCm),
    depth: placement.depthCm * centimetresToScene,
    color: space.colorHex ?? getDefaultSpaceColor(index),
  }
}

function getNestedSpaces(
  parentSpace: LocalSpace,
  spaces: LocalSpace[],
  layouts: SceneLayout[],
  placements: SpacePlacement[],
  colorOffset: number,
) {
  const parentScene = layouts.find((layout) => layout.sceneLocationId === parentSpace.id)

  if (!parentScene) {
    return []
  }

  return spaces
    .filter((space) => space.parentId === parentSpace.id)
    .map((space, index) => {
      const placement = placements.find(
        (entry) => entry.layoutId === parentScene.id && entry.locationId === space.id,
      )

      if (!placement) {
        return null
      }

      const centimetresToScene = 0.01

      return {
        space,
        layout: {
          position: [
            (placement.xCm + placement.widthCm / 2 - parentScene.widthCm / 2) * centimetresToScene,
            placement.yCm * centimetresToScene,
            (placement.zCm + placement.depthCm / 2 - parentScene.depthCm / 2) * centimetresToScene,
          ] as [number, number, number],
          width: placement.widthCm * centimetresToScene,
          height: toSceneHeight(placement.heightCm),
          depth: placement.depthCm * centimetresToScene,
          color: space.colorHex ?? getDefaultSpaceColor(colorOffset + index + 1),
        } satisfies NestedRoomLayout,
      }
    })
    .filter((entry): entry is { space: LocalSpace, layout: NestedRoomLayout } => entry !== null)
}

function getStructureLayouts(
  layout: HomeLayout | SceneLayout,
  structures: SceneStructure[],
): StructureLayout[] {
  const sceneLocationId = 'sceneLocationId' in layout
    ? layout.sceneLocationId
    : null

  return structures
    .filter((structure) => structure.layoutId === layout.id)
    .map((structure) => ({
      id: structure.id,
      kind: structure.kind,
      name: structure.name,
      position: [
        (structure.xCm + structure.widthCm / 2 - layout.widthCm / 2) * 0.01,
        structure.yCm * 0.01,
        (structure.zCm + structure.depthCm / 2 - layout.depthCm / 2) * 0.01,
      ] as [number, number, number],
      width: structure.widthCm * 0.01,
      height: toSceneHeight(structure.heightCm),
      depth: structure.depthCm * 0.01,
      color: structure.colorHex ?? (structure.kind === 'window' ? '#38BDF8' : '#C4B5FD'),
      editHref: sceneLocationId
        ? `/app/space/${sceneLocationId}/structure/create?edit=${structure.id}`
        : null,
    }))
}

function toSceneHeight(heightCm: number) {
  return (heightCm > 0 ? heightCm : 100) * 0.01
}

function getNestedStructureLayouts(
  parentSpace: LocalSpace,
  layouts: SceneLayout[],
  structures: SceneStructure[],
) {
  const parentScene = layouts.find((layout) => layout.sceneLocationId === parentSpace.id)

  return parentScene ? getStructureLayouts(parentScene, structures) : []
}

function HouseStructure({ homeLayout }: { homeLayout: HomeLayout | null }) {
  const width = homeLayout ? homeLayout.widthCm * 0.01 : 9
  const depth = homeLayout ? homeLayout.depthCm * 0.01 : 6
  const gridDivisions = Math.min(90, Math.max(12, Math.round(Math.max(width, depth) * 10)))

  return (
    <group>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[width, 0.12, depth]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <RectangularGrid width={width} depth={depth} divisions={gridDivisions} color="#ddd6fe" />
    </group>
  )
}

function RoomZone({
  space,
  layout,
  nestedSpaces,
  nestedStructures,
}: {
  space: LocalSpace
  layout: RoomLayout
  nestedSpaces: Array<{ space: LocalSpace, layout: NestedRoomLayout }>
  nestedStructures: StructureLayout[]
}) {
  const router = useRouter()

  return (
    <group position={layout.position}>
      <mesh
        position={[0, layout.height / 2, 0]}
        onClick={() => router.push(`/app/space/${space.id}`)}
        onPointerEnter={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerLeave={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[layout.width, layout.height, layout.depth]} />
        <meshStandardMaterial color={layout.color} transparent opacity={0.16} roughness={0.5} />
      </mesh>
      <RectangularGrid
        width={layout.width}
        depth={layout.depth}
        divisions={Math.max(6, Math.round(Math.max(layout.width, layout.depth) * 10))}
        positionY={0.035}
        color={layout.color}
      />

      {space.isPanelVisible !== false && (
        <SpaceLabel name={space.name} position={[0, layout.height + 0.08, 0]} />
      )}

      {nestedSpaces.map(({ space: nestedSpace, layout: nestedLayout }) => (
        <NestedRoomZone
          key={nestedSpace.id}
          space={nestedSpace}
          layout={nestedLayout}
        />
      ))}
      {nestedStructures.map((structure) => (
        <StructureZone key={structure.id} structure={structure} nested />
      ))}
    </group>
  )
}

function StructureZone({
  structure,
  nested = false,
}: {
  structure: StructureLayout
  nested?: boolean
}) {
  const router = useRouter()

  return (
    <group position={structure.position}>
      <mesh
        position={[0, structure.height / 2, 0]}
        onClick={structure.editHref ? (event) => {
          event.stopPropagation()
          const editHref = structure.editHref
          if (editHref) {
            router.push(editHref)
          }
        } : undefined}
        onPointerEnter={structure.editHref ? (event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        } : undefined}
        onPointerLeave={structure.editHref ? () => {
          document.body.style.cursor = 'auto'
        } : undefined}
      >
        <boxGeometry args={[structure.width, structure.height, structure.depth]} />
        <meshStandardMaterial
          color={structure.color}
          transparent
          opacity={nested ? 0.72 : 0.84}
          roughness={0.42}
        />
      </mesh>
      <SpaceLabel
        name={`${structure.kind === 'window' ? '창문' : '벽'} · ${structure.name}`}
        position={[0, structure.height + 0.04, 0]}
      />
    </group>
  )
}

function NestedRoomZone({
  space,
  layout,
}: {
  space: LocalSpace
  layout: NestedRoomLayout
}) {
  const router = useRouter()

  return (
    <group position={layout.position}>
      <mesh
        position={[0, layout.height / 2, 0]}
        onClick={(event) => {
          event.stopPropagation()
          router.push(`/app/space/${space.id}`)
        }}
        onPointerEnter={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerLeave={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[layout.width, layout.height, layout.depth]} />
        <meshStandardMaterial color={layout.color} transparent opacity={0.42} roughness={0.45} />
      </mesh>
      <RectangularGrid
        width={layout.width}
        depth={layout.depth}
        divisions={Math.max(4, Math.round(Math.max(layout.width, layout.depth) * 10))}
        positionY={0.035}
        color={layout.color}
      />
      {space.isPanelVisible !== false && (
        <SpaceLabel name={space.name} position={[0, layout.height + 0.08, 0]} />
      )}
    </group>
  )
}

function SpaceLabel({
  name,
  position = [0, 0.08, 0],
}: {
  name: string
  position?: [number, number, number]
}) {
  const labelWidth = Math.max(0.9, Math.min(1.8, name.length * 0.2 + 0.35))

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <planeGeometry args={[labelWidth, 0.34]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.9} />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.14}
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        maxWidth={labelWidth - 0.14}
      >
        {name}
      </Text>
    </group>
  )
}

export function RectangularGrid({
  width,
  depth,
  divisions,
  positionY = 0,
  color = '#64748b',
}: {
  width: number
  depth: number
  divisions: number
  positionY?: number
  color?: string
}) {
  const geometry = useMemo(() => {
    const points: number[] = []
    const halfWidth = width / 2
    const halfDepth = depth / 2
    const columns = Math.max(1, Math.round(divisions * width / Math.max(width, depth)))
    const rows = Math.max(1, Math.round(divisions * depth / Math.max(width, depth)))

    for (let column = 0; column <= columns; column += 1) {
      const x = -halfWidth + width * column / columns
      points.push(x, 0, -halfDepth, x, 0, halfDepth)
    }

    for (let row = 0; row <= rows; row += 1) {
      const z = -halfDepth + depth * row / rows
      points.push(-halfWidth, 0, z, halfWidth, 0, z)
    }

    const nextGeometry = new BufferGeometry()
    nextGeometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    return nextGeometry
  }, [depth, divisions, width])

  return (
    <lineSegments geometry={geometry} position={[0, positionY, 0]}>
      <lineBasicMaterial color={color} transparent opacity={0.55} />
    </lineSegments>
  )
}
