import type { GridRect, SpaceLayout } from '@/lib/space/types'

export function isInsideLayout(rect: GridRect, layout: SpaceLayout) {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.width <= layout.grid.width &&
    rect.y + rect.height <= layout.grid.height
  )
}

export function hasOverlap(first: GridRect, second: GridRect) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  )
}

export function validateLayout(layout: SpaceLayout) {
  for (const node of layout.nodes) {
    if (!isInsideLayout(node.rect, layout)) {
      throw new Error(`${node.name}이(가) 부모 영역 경계를 벗어났습니다.`)
    }
  }

  for (let index = 0; index < layout.nodes.length; index += 1) {
    const currentNode = layout.nodes[index]

    for (const nextNode of layout.nodes.slice(index + 1)) {
      if (hasOverlap(currentNode.rect, nextNode.rect)) {
        throw new Error(`${currentNode.name}과(와) ${nextNode.name}의 배치가 겹칩니다.`)
      }
    }
  }

  return layout
}
