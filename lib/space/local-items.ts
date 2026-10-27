import type { LocalSpace } from '@/lib/space/local-spaces'

export const LOCAL_ITEMS_KEY = 'storage-basket:items:v1'
export const LOCAL_ITEMS_UPDATED_EVENT = 'storage-basket:items-updated'

const emptyLocalItems: LocalItem[] = []
let cachedRawValue: string | null | undefined
let cachedItems: LocalItem[] = emptyLocalItems

export type LocalItem = {
  id: string
  title: string
  locationId: string
  quantity: number
  unit: string
  category: string | null
  note: string | null
  createdAt: string
}

export function readLocalItems(): LocalItem[] {
  const savedValue = window.localStorage.getItem(LOCAL_ITEMS_KEY)

  if (savedValue === cachedRawValue) {
    return cachedItems
  }

  cachedRawValue = savedValue

  if (!savedValue) {
    cachedItems = emptyLocalItems
    return cachedItems
  }

  try {
    const parsedValue: unknown = JSON.parse(savedValue)
    cachedItems = Array.isArray(parsedValue) ? (parsedValue as LocalItem[]) : emptyLocalItems
    return cachedItems
  } catch {
    cachedItems = emptyLocalItems
    return cachedItems
  }
}

export function writeLocalItems(items: LocalItem[]) {
  const savedValue = JSON.stringify(items)
  cachedRawValue = savedValue
  cachedItems = items
  window.localStorage.setItem(LOCAL_ITEMS_KEY, savedValue)
  window.dispatchEvent(new Event(LOCAL_ITEMS_UPDATED_EVENT))
}

export function subscribeToLocalItems(listener: () => void) {
  window.addEventListener(LOCAL_ITEMS_UPDATED_EVENT, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(LOCAL_ITEMS_UPDATED_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function getLocalItemsServerSnapshot() {
  return emptyLocalItems
}

type DemoItemDefinition = {
  key: string
  locationPath: string[]
  title: string
  quantity: number
  unit: string
  category: string
  note: string | null
}

const demoItemDefinitions: DemoItemDefinition[] = [
  {
    key: 'aa-batteries',
    locationPath: ['거실', 'TV장', '오른쪽 서랍'],
    title: 'AA 건전지',
    quantity: 8,
    unit: '개',
    category: '전자기기',
    note: '리모컨 교체용',
  },
  {
    key: 'usb-c-cables',
    locationPath: ['거실', 'TV장', '오른쪽 서랍'],
    title: 'USB-C 충전 케이블',
    quantity: 3,
    unit: '개',
    category: '전자기기',
    note: '여분 케이블',
  },
  {
    key: 'remote-controls',
    locationPath: ['거실', 'TV장', '왼쪽 서랍'],
    title: 'TV 리모컨',
    quantity: 2,
    unit: '개',
    category: '전자기기',
    note: 'TV와 셋톱박스용',
  },
  {
    key: 'blanket',
    locationPath: ['거실', '소파 옆 수납장'],
    title: '무릎 담요',
    quantity: 2,
    unit: '장',
    category: '생활용품',
    note: '겨울용',
  },
  {
    key: 'mugs',
    locationPath: ['부엌', '상부장', '컵 선반'],
    title: '머그컵',
    quantity: 6,
    unit: '개',
    category: '주방용품',
    note: '손님용 포함',
  },
  {
    key: 'tea-bags',
    locationPath: ['부엌', '상부장', '컵 선반'],
    title: '캐모마일 티백',
    quantity: 20,
    unit: '개',
    category: '식료품',
    note: '개봉일 기록 필요',
  },
  {
    key: 'pasta',
    locationPath: ['부엌', '하부장', '식료품 서랍'],
    title: '파스타 면',
    quantity: 2,
    unit: '봉',
    category: '식료품',
    note: '유통기한 확인',
  },
  {
    key: 'seasonal-coat',
    locationPath: ['안방', '옷장', '계절 옷 칸'],
    title: '겨울 코트',
    quantity: 2,
    unit: '벌',
    category: '의류',
    note: '드라이클리닝 후 보관',
  },
  {
    key: 'sleep-mask',
    locationPath: ['안방', '침대 옆 서랍'],
    title: '수면 안대',
    quantity: 1,
    unit: '개',
    category: '생활용품',
    note: null,
  },
]

/**
 * 공간 경로를 찾을 수 있는 물건만 추가한다.
 * 같은 보관 공간에 같은 이름의 물건이 있으면 기존 기록을 유지한다.
 */
export function addDemoLocalItems(existingItems: LocalItem[], spaces: LocalSpace[]) {
  const nextItems = [...existingItems]

  for (const definition of demoItemDefinitions) {
    const location = findSpaceByPath(spaces, definition.locationPath)

    if (!location) {
      continue
    }

    const alreadyExists = nextItems.some(
      (item) => item.locationId === location.id && item.title === definition.title,
    )

    if (alreadyExists) {
      continue
    }

    nextItems.push({
      id: `demo-item-${definition.key}`,
      title: definition.title,
      locationId: location.id,
      quantity: definition.quantity,
      unit: definition.unit,
      category: definition.category,
      note: definition.note,
      createdAt: new Date().toISOString(),
    })
  }

  return nextItems
}

function findSpaceByPath(spaces: LocalSpace[], path: string[]) {
  let parentId: string | null = null
  let currentSpace: LocalSpace | undefined

  for (const name of path) {
    currentSpace = spaces.find(
      (space) => space.parentId === parentId && space.name === name,
    )

    if (!currentSpace) {
      return null
    }

    parentId = currentSpace.id
  }

  return currentSpace ?? null
}
