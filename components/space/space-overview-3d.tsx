'use client'

import { Html, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useRouter } from 'next/navigation'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { useMemo } from 'react'
import type { LocalSpace } from '@/lib/space/local-spaces'
import type { HomeLayout, SpacePlacement } from '@/lib/space/use-supabase-inventory'

type SpaceOverview3dProps = {
  spaces: LocalSpace[]
  homeLayout: HomeLayout | null
  placements: SpacePlacement[]
}

type RoomLayout = {
  position: [number, number, number]
  width: number
  depth: number
  color: string
}

const roomColors = ['#8b5cf6', '#0ea5e9', '#ec4899', '#f59e0b', '#14b8a6']

export function SpaceOverview3d({
  spaces,
  homeLayout,
  placements,
}: SpaceOverview3dProps) {
  const router = useRouter()
  const rootSpaces = spaces.filter((space) => space.parentId === null)
  const homeWidth = homeLayout ? homeLayout.widthCm * 0.01 : 9
  const homeDepth = homeLayout ? homeLayout.depthCm * 0.01 : 6
  const cameraHeight = Math.max(homeWidth, homeDepth) * 1.7
  const placedRootSpaces = rootSpaces.filter((space) => placements.some((placement) => placement.locationId === space.id))
  const unplacedRootSpaces = rootSpaces.filter((space) => !placements.some((placement) => placement.locationId === space.id))

  return (
    <div className="mt-4 overflow-hidden border border-slate-200 bg-white shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
        <span>3D 집 구조</span>
        <span className="text-violet-600">방 바닥을 클릭해 내부로 이동</span>
      </div>
      <div className="h-96">
        <Canvas camera={{ position: [0, cameraHeight, 0.01], fov: 42 }}>
          <color attach="background" args={['#f8fafc']} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 8, 4]} intensity={2.5} />

          <HouseStructure homeLayout={homeLayout} />
          {placedRootSpaces.map((space, index) => {
            const layout = getRoomLayout(space.id, index, homeLayout, placements)
            if (!layout) return null

            return (
              <RoomZone
                key={space.id}
                space={space}
                layout={layout}
              />
            )
          })}

          <OrbitControls
            target={[0, 0, 0]}
            enablePan={false}
            minDistance={7}
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
  spaceId: string,
  index: number,
  homeLayout: HomeLayout | null,
  placements: SpacePlacement[],
) : RoomLayout | null {
  const placement = placements.find((entry) => entry.locationId === spaceId)

  if (!homeLayout || !placement) {
    return null
  }

  const centimetresToScene = 0.01

  return {
    position: [
      (placement.xCm + placement.widthCm / 2 - homeLayout.widthCm / 2) * centimetresToScene,
      0,
      (placement.zCm + placement.depthCm / 2 - homeLayout.depthCm / 2) * centimetresToScene,
    ] as [number, number, number],
    width: placement.widthCm * centimetresToScene,
    depth: placement.depthCm * centimetresToScene,
    color: roomColors[index % roomColors.length],
  }
}

function HouseStructure({ homeLayout }: { homeLayout: HomeLayout | null }) {
  const width = homeLayout ? homeLayout.widthCm * 0.01 : 9
  const depth = homeLayout ? homeLayout.depthCm * 0.01 : 6
  const gridDivisions = Math.min(90, Math.max(12, Math.round(Math.max(width, depth) * 10)))

  return (
    <group>
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[width, 0.12, depth]} />
        <meshStandardMaterial color="#1e293b" roughness={0.75} />
      </mesh>
      <RectangularGrid width={width} depth={depth} divisions={gridDivisions} />
    </group>
  )
}

function RoomZone({
  space,
  layout,
}: {
  space: LocalSpace
  layout: RoomLayout
}) {
  const router = useRouter()

  return (
    <group position={layout.position}>
      <mesh
        position={[0, 0.01, 0]}
        onClick={() => router.push(`/app/space/${space.id}`)}
        onPointerEnter={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerLeave={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[layout.width, 0.04, layout.depth]} />
        <meshStandardMaterial color={layout.color} transparent opacity={0.24} roughness={0.5} />
      </mesh>
      <RectangularGrid
        width={layout.width}
        depth={layout.depth}
        divisions={Math.max(6, Math.round(Math.max(layout.width, layout.depth) * 10))}
        positionY={0.035}
        color="#c4b5fd"
      />

      {space.isPanelVisible !== false && (
        <Html position={[0, 0.15, 0]} center transform sprite distanceFactor={8}>
          <div className="min-w-20 rounded-lg border border-white/20 bg-slate-950/90 px-2 py-1.5 text-center text-xs font-extrabold text-white shadow-lg">
            {space.name}
          </div>
        </Html>
      )}
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
