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
