export const centimetresToScene = 0.01

// 위치는 물체 아랫면의 시작점이고 Three.js mesh.position은 물체 중심이다.
// 이전 배치 높이나 부모 높이를 더하지 않는다.
export function toSceneCenter({
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

// 전체 부모 경계를 감싸는 구를 시야 안에 넣고, 회전 중심을 높이의 절반에 둔다.
export function getSpacePreviewFrame(bounds: { widthCm: number; heightCm: number; depthCm: number }, fov = 45) {
  const width = bounds.widthCm * centimetresToScene
  const height = bounds.heightCm * centimetresToScene
  const depth = bounds.depthCm * centimetresToScene
  const target: [number, number, number] = [width / 2, height / 2, depth / 2]
  const radius = Math.hypot(width, height, depth) / 2
  const distance = Math.max(0.1, radius / Math.sin(fov * Math.PI / 360) * 1.15)
  const offset = distance / Math.hypot(1, 0.85, 1)
  const position: [number, number, number] = [target[0] + offset, target[1] + offset * 0.85, target[2] + offset]
  return { target, position, distance }
}
