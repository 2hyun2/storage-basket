'use client'

import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { useMemo, useState } from 'react'

type DemoObject = {
  name: string
  color: string
  position: [number, number, number]
  size: [number, number, number]
}

type GridSurfaceProps = {
  width: number
  height: number
  divisions: number
  position: [number, number, number]
  rotation?: [number, number, number]
}

type SpaceItemPreview = {
  title: string
  quantity: number
  unit: string | null
}

const drawer = {
  width: 6,
  height: 1.6,
  depth: 4,
}

const demoObjects: DemoObject[] = [
  {
    name: 'AA 건전지 상자',
    color: '#7c3aed',
    position: [-1.5, 0.35, -0.5],
    size: [1.2, 0.7, 1.1],
  },
  {
    name: '충전 케이블 파우치',
    color: '#0284c7',
    position: [1.1, 0.28, 0.45],
    size: [1.6, 0.56, 0.9],
  },
  {
    name: '리모컨',
    color: '#475569',
    position: [0.2, 0.16, -1.1],
    size: [0.45, 0.32, 1.5],
  },
]

export function Storage3dPreview({
  spaceName = '오른쪽 서랍',
  items = [],
}: {
  spaceName?: string
  items?: SpaceItemPreview[]
}) {
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null)
  const [pinnedTarget, setPinnedTarget] = useState<string | null>(null)
  const activeTarget = pinnedTarget ?? hoveredTarget

  function togglePinnedTarget(target: string) {
    setPinnedTarget((current) => (current === target ? null : target))
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-violet-100 bg-slate-950">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-xs font-bold text-white">
        <span>3D 내부 미리보기</span>
        <span className="text-violet-200">호버·클릭 정보 · 드래그 회전</span>
      </div>
      <div className="relative h-72">
        <Canvas frameloop="demand"
          camera={{ position: [0, 6.8, 0.01], fov: 42 }}
          onPointerMissed={() => {
            setHoveredTarget(null)
            setPinnedTarget(null)
          }}
        >
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={1.25} />
          <directionalLight position={[4, 6, 4]} intensity={2} />

          <DrawerStructure
            onFocus={() => setHoveredTarget('space')}
            onBlur={() => setHoveredTarget(null)}
            onSelect={() => togglePinnedTarget('space')}
          />
          {demoObjects.map((object) => (
            <StorageObject
              key={object.name}
              object={object}
              onFocus={() => setHoveredTarget(object.name)}
              onBlur={() => setHoveredTarget(null)}
              onSelect={() => togglePinnedTarget(object.name)}
            />
          ))}

          <OrbitControls
            target={[0, 0, 0]}
            enablePan={false}
            minDistance={3}
            maxDistance={10}
            minPolarAngle={0.08}
            maxPolarAngle={Math.PI / 2 - 0.08}
          />
        </Canvas>

        {activeTarget && (
          <SpaceHint
            spaceName={spaceName}
            items={items}
            highlightedObject={activeTarget === 'space' ? null : activeTarget}
            isPinned={pinnedTarget !== null}
          />
        )}
      </div>
    </div>
  )
}

function DrawerStructure({
  onFocus,
  onBlur,
  onSelect,
}: {
  onFocus: () => void
  onBlur: () => void
  onSelect: () => void
}) {
  const wallMaterial = {
    color: '#a5b4fc',
    transparent: true,
    opacity: 0.26,
    roughness: 0.5,
    depthWrite: false,
  }

  return (
    <group onPointerEnter={onFocus} onPointerLeave={onBlur} onClick={onSelect}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[drawer.width, 0.1, drawer.depth]} />
        <meshStandardMaterial {...wallMaterial} opacity={0.34} />
      </mesh>

      <mesh position={[-drawer.width / 2, drawer.height / 2, 0]}>
        <boxGeometry args={[0.12, drawer.height, drawer.depth]} />
        <meshStandardMaterial {...wallMaterial} />
      </mesh>
      <mesh position={[drawer.width / 2, drawer.height / 2, 0]}>
        <boxGeometry args={[0.12, drawer.height, drawer.depth]} />
        <meshStandardMaterial {...wallMaterial} />
      </mesh>
      <mesh position={[0, drawer.height / 2, -drawer.depth / 2]}>
        <boxGeometry args={[drawer.width, drawer.height, 0.12]} />
        <meshStandardMaterial {...wallMaterial} />
      </mesh>

      <GridSurface
        width={drawer.width}
        height={drawer.depth}
        divisions={12}
        position={[0, 0.11, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <GridSurface
        width={drawer.width}
        height={drawer.height}
        divisions={12}
        position={[0, drawer.height / 2, -drawer.depth / 2 + 0.07]}
      />
      <GridSurface
        width={drawer.depth}
        height={drawer.height}
        divisions={8}
        position={[-drawer.width / 2 + 0.07, drawer.height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <GridSurface
        width={drawer.depth}
        height={drawer.height}
        divisions={8}
        position={[drawer.width / 2 - 0.07, drawer.height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  )
}

function GridSurface({
  width,
  height,
  divisions,
  position,
  rotation = [0, 0, 0],
}: GridSurfaceProps) {
  const geometry = useMemo(() => {
    const points: number[] = []
    const halfWidth = width / 2
    const halfHeight = height / 2

    for (let index = 0; index <= divisions; index += 1) {
      const ratio = index / divisions
      const x = -halfWidth + width * ratio
      const y = -halfHeight + height * ratio

      points.push(x, -halfHeight, 0, x, halfHeight, 0)
      points.push(-halfWidth, y, 0, halfWidth, y, 0)
    }

    const nextGeometry = new BufferGeometry()
    nextGeometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    return nextGeometry
  }, [divisions, height, width])

  return (
    <lineSegments geometry={geometry} position={position} rotation={rotation}>
      <lineBasicMaterial color="#c4b5fd" transparent opacity={0.32} depthWrite={false} />
    </lineSegments>
  )
}

function StorageObject({
  object,
  onFocus,
  onBlur,
  onSelect,
}: {
  object: DemoObject
  onFocus: () => void
  onBlur: () => void
  onSelect: () => void
}) {
  return (
    <mesh
      position={object.position}
      castShadow
      onPointerEnter={(event) => {
        event.stopPropagation()
        onFocus()
      }}
      onPointerLeave={(event) => {
        event.stopPropagation()
        onBlur()
      }}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <boxGeometry args={object.size} />
      <meshStandardMaterial color={object.color} roughness={0.42} metalness={0.06} />
    </mesh>
  )
}

function SpaceHint({
  spaceName,
  items,
  highlightedObject,
  isPinned,
}: {
  spaceName: string
  items: SpaceItemPreview[]
  highlightedObject: string | null
  isPinned: boolean
}) {
  const visibleItems = items.slice(0, 3)

  return (
    <aside className="pointer-events-none absolute bottom-3 left-3 w-56 rounded-xl border border-violet-200/70 bg-slate-950/90 p-3 text-white shadow-xl backdrop-blur">
      <p className="text-xs font-bold text-violet-200">
        {isPinned ? '선택됨' : '공간 미리보기'}
      </p>
      <p className="mt-1 text-sm font-semibold">{spaceName}</p>
      {highlightedObject && (
        <p className="mt-1 text-xs text-sky-200">가리킨 블록: {highlightedObject}</p>
      )}
      <div className="mt-2 border-t border-white/15 pt-2">
        <p className="text-xs font-bold text-slate-300">내부 물건</p>
        {visibleItems.length > 0 ? (
          <ul className="mt-1 space-y-1 text-xs text-slate-100">
            {visibleItems.map((item) => (
              <li key={item.title} className="flex justify-between gap-2">
                <span className="truncate">{item.title}</span>
                <strong className="shrink-0">수량: {item.quantity} · 단위: {item.unit || '없음'}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-slate-400">등록된 물건이 없습니다.</p>
        )}
      </div>
    </aside>
  )
}
