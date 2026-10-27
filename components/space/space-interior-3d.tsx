'use client'

import { Edges, Html, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useRouter } from 'next/navigation'
import { useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { RectangularGrid } from '@/components/space/space-overview-3d'
import { createClient } from '@/lib/supabase/client'

export type SceneLayoutData = {
  widthCm: number
  heightCm: number
  depthCm: number
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

export type SceneStructureData = {
  id: string
  kind: 'wall' | 'door' | 'window'
  name: string
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
}

type DirectItem = {
  title: string
  quantity: number
  unit: string | null
}

const centimetresToScene = 0.01
const blockColors = ['#8b5cf6', '#0ea5e9', '#ec4899', '#f59e0b']

export function SpaceInterior3d({
  spaceName,
  childSpaces,
  items,
  layout,
  layoutId,
  placements,
  structures,
}: {
  spaceName: string
  childSpaces: ChildSpace[]
  items: DirectItem[]
  layout: SceneLayoutData | null
  layoutId: string | null
  placements: ScenePlacementData[]
  structures: SceneStructureData[]
}) {
  const sceneLayout = layout ?? {
    widthCm: 450,
    heightCm: 240,
    depthCm: 300,
  }
  const sceneWidth = sceneLayout.widthCm * centimetresToScene
  const sceneDepth = sceneLayout.depthCm * centimetresToScene
  const cameraHeight = Math.max(sceneWidth, sceneDepth) * 1.8
  const unplacedSpaces = childSpaces.filter((child) => !placements.some((placement) => placement.locationId === child.id))
  const [editingSpace, setEditingSpace] = useState<ChildSpace | null>(null)

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
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
          <SceneFloor layout={sceneLayout} />
          {structures.map((structure) => (
            <SceneStructureMesh key={structure.id} structure={structure} />
          ))}
          {childSpaces.map((child, index) => (
            <ChildSpaceBlock
              key={child.id}
              child={child}
              index={index}
              total={childSpaces.length}
              layout={sceneLayout}
              placement={placements.find((entry) => entry.locationId === child.id) ?? null}
              onEdit={() => setEditingSpace(child)}
            />
          ))}
          <OrbitControls
            target={[sceneWidth / 2, 0, sceneDepth / 2]}
            enablePan={false}
            minDistance={5}
            maxDistance={11}
            minPolarAngle={0.08}
            maxPolarAngle={Math.PI / 2 - 0.08}
          />
        </Canvas>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
        구조물 {structures.length}개 · 하위 공간 {childSpaces.length}개
        {items.length > 0 && ` · 직접 보관: ${items.map((item) => `${item.title} ${item.quantity}${item.unit ?? ''}`).join(' · ')}`}
      </div>
      {unplacedSpaces.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-extrabold">미배치 공간</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unplacedSpaces.map((space) => <button key={space.id} type="button" onClick={() => setEditingSpace(space)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-violet-600">{space.name} · 격자에 배치</button>)}
          </div>
        </div>
      )}
      {editingSpace && <PlacementEditor space={editingSpace} layoutId={layoutId} placement={placements.find((entry) => entry.locationId === editingSpace.id) ?? null} onClose={() => setEditingSpace(null)} />}
    </section>
  )
}

function SceneFloor({ layout }: { layout: SceneLayoutData }) {
  const width = layout.widthCm * centimetresToScene
  const depth = layout.depthCm * centimetresToScene
  const divisions = Math.max(8, Math.min(90, Math.round(Math.max(layout.widthCm, layout.depthCm) / 10)))

  return (
    <group>
      <mesh position={[width / 2, -0.05, depth / 2]}>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color="#312e81" transparent opacity={0.44} />
      </mesh>
      <group position={[width / 2, 0, depth / 2]}>
        <RectangularGrid width={width} depth={depth} divisions={divisions} color="#a78bfa" />
      </group>
    </group>
  )
}

function SceneStructureMesh({ structure }: { structure: SceneStructureData }) {
  const width = structure.widthCm * centimetresToScene
  const height = structure.heightCm * centimetresToScene
  const depth = structure.depthCm * centimetresToScene
  const color = {
    wall: '#c4b5fd',
    door: '#f59e0b',
    window: '#38bdf8',
  }[structure.kind]

  return (
    <group
      position={[
        (structure.xCm + structure.widthCm / 2) * centimetresToScene,
        (structure.yCm + structure.heightCm / 2) * centimetresToScene,
        (structure.zCm + structure.depthCm / 2) * centimetresToScene,
      ]}
    >
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} transparent opacity={structure.kind === 'wall' ? 0.28 : 0.7} />
        <Edges color="#e2e8f0" threshold={15} />
      </mesh>
      <Html position={[0, height / 2 + 0.08, 0]} center transform sprite distanceFactor={8}>
        <div className="rounded bg-slate-950/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {structure.name}
        </div>
      </Html>
    </group>
  )
}

function ChildSpaceBlock({
  child,
  index,
  total,
  layout,
  placement,
  onEdit,
}: {
  child: ChildSpace
  index: number
  total: number
  layout: SceneLayoutData
  placement: ScenePlacementData | null
  onEdit: () => void
}) {
  const widthCm = placement?.widthCm ?? 100
  const heightCm = placement?.heightCm ?? 100
  const depthCm = placement?.depthCm ?? 80
  const xCm = placement?.xCm ?? layout.widthCm / 2 + (index - (total - 1) / 2) * 120 - widthCm / 2
  const yCm = placement?.yCm ?? 0
  const zCm = placement?.zCm ?? layout.depthCm / 2 - depthCm / 2
  const color = blockColors[index % blockColors.length]

  return (
    <group position={[(xCm + widthCm / 2) * centimetresToScene, (yCm + heightCm / 2) * centimetresToScene, (zCm + depthCm / 2) * centimetresToScene]}>
      <mesh
        onClick={onEdit}
        onPointerEnter={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = 'auto' }}
      >
        <boxGeometry args={[widthCm * centimetresToScene, heightCm * centimetresToScene, depthCm * centimetresToScene]} />
        <meshStandardMaterial color={color} transparent opacity={0.74} roughness={0.38} />
        <Edges color="#f5f3ff" threshold={15} />
      </mesh>
      <Html
        position={[0, heightCm * centimetresToScene / 2 + 0.1, 0]}
        center
        transform
        sprite
        distanceFactor={8}
      >
        <div className="min-w-20 rounded-lg border border-white/20 bg-slate-950/90 px-2 py-1.5 text-center text-xs font-extrabold text-white shadow-lg">
          <p>{child.name}</p>
          <p className="mt-0.5 text-[10px] text-violet-200">{widthCm} × {heightCm} × {depthCm} cm</p>
        </div>
      </Html>
    </group>
  )
}

function PlacementEditor({ space, layoutId, placement, onClose }: { space: ChildSpace; layoutId: string | null; placement: ScenePlacementData | null; onClose: () => void }) {
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const [draft, setDraft] = useState({ x: placement?.xCm ?? 10, y: placement?.yCm ?? 0, z: placement?.zCm ?? 10, width: placement?.widthCm ?? 100, height: placement?.heightCm ?? 100, depth: placement?.depthCm ?? 80 })
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!layoutId) { setMessage('이 공간의 3D 장면을 먼저 만들어야 합니다.'); return }
    const numbers = [draft.x, draft.y, draft.z, draft.width, draft.height, draft.depth]
    if (numbers.some((value) => !Number.isInteger(value) || value < 0) || numbers.slice(3).some((value) => value < 1)) { setMessage('모든 값은 정수 cm여야 합니다.'); return }
    const [x, y, z, width, height, depth] = numbers
    const payload = { layout_id: layoutId, location_id: space.id, x_cm: x, y_cm: y, z_cm: z, width_cm: width, height_cm: height, depth_cm: depth }
    const query = placement ? createClient().from('space_placements').update(payload).eq('id', placement.id) : createClient().from('space_placements').insert(payload)
    const { error } = await query
    if (error) { setMessage(error.message); return }
    onClose(); router.refresh()
  }
  return <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/80 p-4"><form onSubmit={save} className="w-full max-w-md rounded-2xl bg-white p-4 text-slate-900 shadow-xl"><div className="flex items-center justify-between"><h3 className="font-extrabold">{space.name} 3D 배치</h3><button type="button" onClick={onClose} className="text-sm font-bold text-slate-500">닫기</button></div><DragPlacementCanvas draft={draft} onChange={setDraft} /><p className="mt-3 text-xs font-bold text-slate-600">드래그 결과 · 아래에서 1cm 단위 정밀 조정</p><div className="mt-2 grid grid-cols-3 gap-2">{[['x','X'],['y','Y'],['z','Z'],['width','가로'],['height','높이'],['depth','세로']].map(([key,label]) => <label key={key} className="text-xs font-bold">{label}<input type="number" min="0" value={draft[key as keyof typeof draft]} onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })} className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5" /></label>)}</div><p className="mt-2 text-xs text-slate-500">모든 값은 cm입니다.</p>{message && <p className="mt-2 text-xs font-bold text-rose-700">{message}</p>}<button className="mt-4 w-full rounded-xl bg-violet-600 py-2 text-sm font-extrabold text-white">배치 저장</button></form></div>
}

function DragPlacementCanvas({ draft, onChange }: { draft: { x: number; y: number; z: number; width: number; height: number; depth: number }; onChange: (draft: { x: number; y: number; z: number; width: number; height: number; depth: number }) => void }) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<{ x: number; z: number } | null>(null)
  const centimetresPerPixel = 4
  function point(event: PointerEvent<HTMLDivElement>) { const rect = canvasRef.current!.getBoundingClientRect(); return { x: Math.max(0, Math.round((event.clientX - rect.left) * centimetresPerPixel)), z: Math.max(0, Math.round((event.clientY - rect.top) * centimetresPerPixel)) } }
  function start(event: PointerEvent<HTMLDivElement>) { event.currentTarget.setPointerCapture(event.pointerId); startRef.current = point(event) }
  function end(event: PointerEvent<HTMLDivElement>) { if (!startRef.current) return; const next = point(event); const x = Math.min(startRef.current.x, next.x); const z = Math.min(startRef.current.z, next.z); onChange({ ...draft, x, z, width: Math.max(1, Math.abs(next.x - startRef.current.x)), depth: Math.max(1, Math.abs(next.z - startRef.current.z)) }); startRef.current = null }
  return <div ref={canvasRef} onPointerDown={start} onPointerUp={end} className="mt-4 h-40 cursor-crosshair rounded-xl border-2 border-violet-200 bg-[linear-gradient(#ede9fe_1px,transparent_1px),linear-gradient(90deg,#ede9fe_1px,transparent_1px)] [background-size:10px_10px]"><div style={{ left: `${draft.x / centimetresPerPixel}px`, top: `${draft.z / centimetresPerPixel}px`, width: `${draft.width / centimetresPerPixel}px`, height: `${draft.depth / centimetresPerPixel}px` }} className="pointer-events-none relative border-2 border-violet-600 bg-violet-500/30" /></div>
}
