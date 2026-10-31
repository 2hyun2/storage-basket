'use client'

import { Edges } from '@react-three/drei'
import { centimetresToScene, toSceneCenter } from '@/lib/space/scene-coordinates'

type Dimensions = { widthCm: number; heightCm: number; depthCm: number }

// 생성·수정 미리보기 공통 기준선. 벽을 생성하거나 DB에 저장하는 모델이 아니다.
export function ParentSpaceBounds({ dimensions }: { dimensions: Dimensions }) {
  return (
    <mesh
      name="parent-space-bounds"
      position={toSceneCenter({
        ...dimensions,
        xCm: 0,
        elevationCm: 0,
        planYCm: 0,
      })}
    >
      <boxGeometry args={[
        dimensions.widthCm * centimetresToScene,
        dimensions.heightCm * centimetresToScene,
        dimensions.depthCm * centimetresToScene,
      ]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      <Edges color="#475569" />
    </mesh>
  )
}
