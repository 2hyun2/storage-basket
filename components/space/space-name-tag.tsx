'use client'

import { Text } from '@react-three/drei'
import { useCallback, useState } from 'react'

type TextBounds = { width: number; height: number; x: number; y: number }
type SyncedText = { textRenderInfo?: { blockBounds: ArrayLike<number> } }

export function SpaceNameTag({ name, position = [0, 0.08, 0], fontSize = 0.1 }: {
  name: string
  position?: [number, number, number]
  fontSize?: number
}) {
  const [bounds, setBounds] = useState<TextBounds | null>(null)
  // 12px 글자에 px-2 py-1을 적용한 비율. 3D에서도 확대·회전 시 함께 유지한다.
  const paddingX = fontSize * 8 / 12
  const paddingY = fontSize * 4 / 12
  const measureText = useCallback((text: SyncedText) => {
    const box = text.textRenderInfo?.blockBounds
    if (!box) return
    const next = {
      width: box[2] - box[0],
      height: box[3] - box[1],
      x: (box[0] + box[2]) / 2,
      y: (box[1] + box[3]) / 2,
    }
    setBounds((previous) => previous && Object.keys(next).every(
      (key) => previous[key as keyof TextBounds] === next[key as keyof TextBounds],
    ) ? previous : next)
  }, [])

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {bounds && (
        <mesh position={[bounds.x, bounds.y, 0]}>
          <planeGeometry args={[bounds.width + paddingX * 2, bounds.height + paddingY * 2]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.88} />
        </mesh>
      )}
      <Text
        position={[0, 0, 0.01]}
        fontSize={fontSize}
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        whiteSpace="nowrap"
        onSync={measureText}
      >
        {name}
      </Text>
    </group>
  )
}
