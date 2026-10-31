export type PlanRectangle = { x: number; y: number; width: number; depth: number }
export type PlanPoint = { x: number; y: number }
export type PlanGesture = 'move' | 'draw' | 'nw' | 'ne' | 'sw' | 'se'
type Bounds = { width: number; depth: number }
type Guide = { value: number; edge: number }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(Math.max(min, max), value))
const intersects = (a: number, sizeA: number, b: number, sizeB: number) => a < b + sizeB && a + sizeA > b

function snap(value: number, min: number, max: number, candidates: Guide[], tolerance: number) {
  const nearby = candidates.filter((candidate) => candidate.value >= min && candidate.value <= max
    && Math.abs(candidate.value - value) <= tolerance)
    .sort((a, b) => Math.abs(a.value - value) - Math.abs(b.value - value))[0]
  return nearby
    ? { value: nearby.value, guide: nearby.edge }
    : { value: clamp(Math.round(value / 10) * 10, min, max), guide: undefined }
}

// 입력·표시는 평면 X/Y의 cm 기준이다. 높이는 이 조작으로 변경하지 않는다.
export function dragPlanRectangle({ mode, original, start, point, bounds, siblings, tolerance = { x: 5, y: 5 } }: {
  mode: PlanGesture
  original: PlanRectangle
  start: PlanPoint
  point: PlanPoint
  bounds: Bounds
  siblings: PlanRectangle[]
  tolerance?: PlanPoint
}): { rectangle: PlanRectangle; guides: { x?: number; y?: number } } {
  if (mode === 'draw') {
    const minimumX = Math.min(10, bounds.width)
    const minimumY = Math.min(10, bounds.depth)
    const sx = clamp(Math.round(start.x / 10) * 10, 0, bounds.width)
    const sy = clamp(Math.round(start.y / 10) * 10, 0, bounds.depth)
    const ex = clamp(Math.round(point.x / 10) * 10, 0, bounds.width)
    const ey = clamp(Math.round(point.y / 10) * 10, 0, bounds.depth)
    const x = Math.min(sx, ex, bounds.width - minimumX)
    const y = Math.min(sy, ey, bounds.depth - minimumY)
    return { rectangle: {
      x, y,
      width: Math.min(bounds.width - x, Math.max(minimumX, Math.abs(ex - sx))),
      depth: Math.min(bounds.depth - y, Math.max(minimumY, Math.abs(ey - sy))),
    }, guides: {} }
  }

  const dx = point.x - start.x
  const dy = point.y - start.y
  if (mode === 'move') {
    const rawX = clamp(original.x + dx, 0, bounds.width - original.width)
    const rawY = clamp(original.y + dy, 0, bounds.depth - original.depth)
    const xCandidates: Guide[] = [{ value: 0, edge: 0 }, { value: bounds.width - original.width, edge: bounds.width }]
    const yCandidates: Guide[] = [{ value: 0, edge: 0 }, { value: bounds.depth - original.depth, edge: bounds.depth }]
    for (const sibling of siblings) {
      if (intersects(rawY, original.depth, sibling.y, sibling.depth)) {
        xCandidates.push({ value: sibling.x - original.width, edge: sibling.x },
          { value: sibling.x + sibling.width, edge: sibling.x + sibling.width })
      }
      if (intersects(rawX, original.width, sibling.x, sibling.width)) {
        yCandidates.push({ value: sibling.y - original.depth, edge: sibling.y },
          { value: sibling.y + sibling.depth, edge: sibling.y + sibling.depth })
      }
    }
    const x = snap(rawX, 0, bounds.width - original.width, xCandidates, tolerance.x)
    const y = snap(rawY, 0, bounds.depth - original.depth, yCandidates, tolerance.y)
    return { rectangle: { ...original, x: x.value, y: y.value }, guides: { x: x.guide, y: y.guide } }
  }

  const west = mode.includes('w')
  const north = mode.includes('n')
  const fixedX = west ? original.x + original.width : original.x
  const fixedY = north ? original.y + original.depth : original.y
  const rawX = (west ? original.x : original.x + original.width) + dx
  const rawY = (north ? original.y : original.y + original.depth) + dy
  const minX = west ? 0 : fixedX + 1
  const maxX = west ? fixedX - 1 : bounds.width
  const minY = north ? 0 : fixedY + 1
  const maxY = north ? fixedY - 1 : bounds.depth
  const xCandidates: Guide[] = [{ value: 0, edge: 0 }, { value: bounds.width, edge: bounds.width }]
  const yCandidates: Guide[] = [{ value: 0, edge: 0 }, { value: bounds.depth, edge: bounds.depth }]
  for (const sibling of siblings) {
    if (intersects(Math.min(fixedY, rawY), Math.abs(rawY - fixedY), sibling.y, sibling.depth)) {
      const edge = west ? sibling.x + sibling.width : sibling.x
      xCandidates.push({ value: edge, edge })
    }
    if (intersects(Math.min(fixedX, rawX), Math.abs(rawX - fixedX), sibling.x, sibling.width)) {
      const edge = north ? sibling.y + sibling.depth : sibling.y
      yCandidates.push({ value: edge, edge })
    }
  }
  const x = snap(rawX, minX, maxX, xCandidates, tolerance.x)
  const y = snap(rawY, minY, maxY, yCandidates, tolerance.y)
  return { rectangle: {
    x: Math.min(fixedX, x.value), y: Math.min(fixedY, y.value),
    width: Math.abs(x.value - fixedX), depth: Math.abs(y.value - fixedY),
  }, guides: { x: x.guide, y: y.guide } }
}
