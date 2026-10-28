export const LOCAL_SPACES_KEY = 'storage-basket:spaces:v1'
export const LOCAL_SPACES_UPDATED_EVENT = 'storage-basket:spaces-updated'
const emptyLocalSpaces: LocalSpace[] = []
let cachedRawValue: string | null | undefined
let cachedSpaces: LocalSpace[] = emptyLocalSpaces

export type SpaceRegistrationMode = 'simple' | 'map'

export type SpacePlacement = {
  xCm: number
  yCm: number
  zCm: number
  widthCm: number
  heightCm: number
  depthCm: number
  displayKind: 'room' | 'cabinet' | 'drawer' | 'box'
  rotationY: number
}

export type LocalSpace = {
  id: string
  name: string
  parentId: string | null
  mode: SpaceRegistrationMode
  placement: SpacePlacement | null
  createdAt: string
  isPanelVisible?: boolean
  colorHex?: string
}

export function readLocalSpaces(): LocalSpace[] {
  const savedValue = window.localStorage.getItem(LOCAL_SPACES_KEY)

  if (savedValue === cachedRawValue) {
    return cachedSpaces
  }

  cachedRawValue = savedValue

  if (!savedValue) {
    cachedSpaces = emptyLocalSpaces
    return cachedSpaces
  }

  try {
    const parsedValue: unknown = JSON.parse(savedValue)
    cachedSpaces = Array.isArray(parsedValue) ? (parsedValue as LocalSpace[]) : emptyLocalSpaces
    return cachedSpaces
  } catch {
    cachedSpaces = emptyLocalSpaces
    return cachedSpaces
  }
}

export function writeLocalSpaces(spaces: LocalSpace[]) {
  const savedValue = JSON.stringify(spaces)
  cachedRawValue = savedValue
  cachedSpaces = spaces
  window.localStorage.setItem(LOCAL_SPACES_KEY, savedValue)
  window.dispatchEvent(new Event(LOCAL_SPACES_UPDATED_EVENT))
}

export function subscribeToLocalSpaces(listener: () => void) {
  window.addEventListener(LOCAL_SPACES_UPDATED_EVENT, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(LOCAL_SPACES_UPDATED_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function getLocalSpacesServerSnapshot() {
  return emptyLocalSpaces
}

export function findDuplicateSpace(
  spaces: LocalSpace[],
  name: string,
  parentId: string | null,
) {
  const normalizedName = name.trim().toLocaleLowerCase('ko-KR')

  return spaces.some(
    (space) =>
      space.parentId === parentId &&
      space.name.trim().toLocaleLowerCase('ko-KR') === normalizedName,
  )
}

type DemoSpaceDefinition = {
  key: string
  parentKey: string | null
  name: string
  mode: SpaceRegistrationMode
}

const demoSpaceDefinitions: DemoSpaceDefinition[] = [
  { key: 'living-room', parentKey: null, name: '거실', mode: 'map' },
  { key: 'tv-cabinet', parentKey: 'living-room', name: 'TV장', mode: 'map' },
  { key: 'left-drawer', parentKey: 'tv-cabinet', name: '왼쪽 서랍', mode: 'simple' },
  { key: 'right-drawer', parentKey: 'tv-cabinet', name: '오른쪽 서랍', mode: 'simple' },
  { key: 'sofa-storage', parentKey: 'living-room', name: '소파 옆 수납장', mode: 'simple' },
  { key: 'kitchen', parentKey: null, name: '부엌', mode: 'map' },
  { key: 'upper-cabinet', parentKey: 'kitchen', name: '상부장', mode: 'map' },
  { key: 'cup-shelf', parentKey: 'upper-cabinet', name: '컵 선반', mode: 'simple' },
  { key: 'lower-cabinet', parentKey: 'kitchen', name: '하부장', mode: 'map' },
  { key: 'food-drawer', parentKey: 'lower-cabinet', name: '식료품 서랍', mode: 'simple' },
  { key: 'bedroom', parentKey: null, name: '안방', mode: 'map' },
  { key: 'wardrobe', parentKey: 'bedroom', name: '옷장', mode: 'map' },
  { key: 'seasonal-clothes', parentKey: 'wardrobe', name: '계절 옷 칸', mode: 'simple' },
  { key: 'bedside-drawer', parentKey: 'bedroom', name: '침대 옆 서랍', mode: 'simple' },
]

/**
 * 기존 공간은 유지하면서, 화면 흐름을 확인할 수 있는 예시 공간 경로만 채운다.
 * 같은 부모 아래 같은 이름이 있으면 새로 만들지 않아 여러 번 실행해도 안전하다.
 */
export function addDemoLocalSpaces(existingSpaces: LocalSpace[]) {
  const nextSpaces = [...existingSpaces]
  const spaceIdByDemoKey = new Map<string, string | null>([['home', null]])

  for (const definition of demoSpaceDefinitions) {
    const parentId = definition.parentKey
      ? spaceIdByDemoKey.get(definition.parentKey) ?? null
      : null
    const existingSpace = nextSpaces.find(
      (space) => space.parentId === parentId && space.name === definition.name,
    )

    if (existingSpace) {
      spaceIdByDemoKey.set(definition.key, existingSpace.id)
      continue
    }

    const nextSpace: LocalSpace = {
      id: `demo-${definition.key}`,
      name: definition.name,
      parentId,
      mode: definition.mode,
      placement: null,
      createdAt: new Date().toISOString(),
    }

    nextSpaces.push(nextSpace)
    spaceIdByDemoKey.set(definition.key, nextSpace.id)
  }

  return nextSpaces
}
