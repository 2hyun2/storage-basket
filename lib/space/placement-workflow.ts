import type { PlanRectangle } from './plan-gestures'

export type PlacementStep = 'size' | 'position'
type Size = { width: number; depth: number; height: number }
type Position = { x: number; y: number; z: number }
type Bounds = { widthCm: number; depthCm: number; heightCm: number }

export function getPlacementSizeError(size: Size, bounds: Bounds | null) {
  if (!bounds) return '먼저 바깥 공간의 크기를 정해 주세요.'
  if ([size.width, size.depth, size.height].some((value) => !Number.isInteger(value) || value < 1)) {
    return '가로·세로·자체 높이는 1cm 이상의 정수로 입력해 주세요.'
  }
  if (size.width > bounds.widthCm || size.depth > bounds.depthCm || size.height > bounds.heightCm) {
    return '바깥 공간 안에 들어갈 수 있도록 크기를 줄여 주세요.'
  }
  return null
}

// 단계 전환 시 크기는 그대로 두고, 필요한 경우 임시 위치만 안쪽으로 맞춘다.
export function fitPlacementPosition(position: Position, size: Size, bounds: Bounds): Position {
  const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value))
  return {
    x: clamp(position.x, Math.max(0, bounds.widthCm - size.width)),
    y: clamp(position.y, Math.max(0, bounds.depthCm - size.depth)),
    z: clamp(position.z, Math.max(0, bounds.heightCm - size.height)),
  }
}

// 서로 다른 단계의 드래그가 위치/크기를 동시에 변경하지 못하도록 한곳에서 제한한다.
export function applyPlanEdit(step: PlacementStep, current: PlanRectangle, next: PlanRectangle): PlanRectangle {
  return step === 'size'
    ? { ...current, width: next.width, depth: next.depth }
    : { ...current, x: next.x, y: next.y }
}
