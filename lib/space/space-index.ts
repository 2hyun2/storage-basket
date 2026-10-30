import type { LocalSpace } from './local-spaces'

// TanStack Query가 유지하는 같은 배열은 색인도 재사용한다.
const indexes = new WeakMap<LocalSpace[], Map<string, LocalSpace>>()

export function getSpaceIndex(spaces: LocalSpace[]) {
  let index = indexes.get(spaces)
  if (!index) {
    index = new Map(spaces.map((space) => [space.id, space]))
    indexes.set(spaces, index)
  }
  return index
}
