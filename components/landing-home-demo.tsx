'use client'

import { Html, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { RectangularGrid } from '@/components/space/space-overview-3d'

const rooms = [
  { name: '거실', position: [-1.5, 0, 0] as const, size: [3, 4] as const, color: '#ddd6fe', storage: 'TV장 · 소파 수납장' },
  { name: '안방', position: [1.5, 0, 1] as const, size: [3, 2] as const, color: '#fecdd3', storage: '옷장 · 침대 옆 서랍' },
  { name: '작은방', position: [1.5, 0, -1] as const, size: [3, 2] as const, color: '#bae6fd', storage: '책장 · 침대 하부장' },
] satisfies Array<{
  name: string
  position: [number, number, number]
  size: [number, number]
  color: string
  storage: string
}>

export function LandingHomeDemo() {
  return (
    <section className="h-full min-h-72 overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
        <span>600 × 400cm · 2룸 설계 예시</span>
        <span className="text-violet-600">10cm 격자</span>
      </div>
      <div className="h-72 sm:h-80">
        <Canvas camera={{ position: [0, 7.2, 0.01], fov: 42 }}>
          <color attach="background" args={['#fafafa']} />
          <ambientLight intensity={1.6} />
          <directionalLight position={[3, 7, 4]} intensity={1.4} />
          <mesh position={[0, -0.08, 0]}><boxGeometry args={[6, 0.12, 4]} /><meshStandardMaterial color="#f1f5f9" /></mesh>
          <RectangularGrid width={6} depth={4} divisions={40} color="#ddd6fe" />
          {rooms.map((room) => <Room key={room.name} {...room} />)}
          <OrbitControls target={[0, 0, 0]} enablePan={false} minPolarAngle={0.08} maxPolarAngle={Math.PI / 2 - 0.08} minDistance={4} maxDistance={10} />
        </Canvas>
      </div>
      <div className="grid grid-cols-3 border-t border-slate-100 bg-white text-center text-[10px] font-bold text-slate-500"><span className="py-2">방 3개</span><span className="border-x border-slate-100 py-2">수납공간 6개</span><span className="py-2">미배치 0개</span></div>
    </section>
  )
}

function Room({ name, position, size, color, storage }: { name: string; position: [number, number, number]; size: [number, number]; color: string; storage: string }) {
  const [width, depth] = size
  return <group position={position}><mesh position={[0, 0.03, 0]}><boxGeometry args={[width, 0.08, depth]} /><meshStandardMaterial color={color} transparent opacity={0.72} /></mesh><Html position={[0, 0.13, 0]} center transform sprite distanceFactor={8}><div className="min-w-24 rounded-lg border border-slate-200 bg-white/95 px-2 py-1.5 text-center shadow"><p className="text-xs font-extrabold text-slate-800">{name}</p><p className="mt-0.5 text-[9px] text-slate-500">{storage}</p></div></Html></group>
}
