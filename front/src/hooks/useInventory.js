import { useState } from 'react'
import { items as initialItems } from '../data/items'
import { locations as initialLocations } from '../data/locations'
import { getLocationPath } from '../utils/location'

const currentUserId = 'user-minji'

// 서버 연결 전 임시 데이터와 생성 동작을 한 책임으로 관리한다.
export const useInventory = () => {
  const [items, setItems] = useState(initialItems)
  const [locations, setLocations] = useState(initialLocations)

  const createItem = (itemValues) => {
    const now = new Date().toISOString()

    setItems((currentItems) => [
      ...currentItems,
      {
        ...itemValues,
        id: crypto.randomUUID(),
        locationPath: getLocationPath(itemValues.locationId, locations),
        createdAt: now,
        createdBy: currentUserId,
        updatedAt: now,
        updatedBy: currentUserId,
      },
    ])
  }

  const createLocation = (locationValues) => {
    const now = new Date().toISOString()
    const newLocation = {
      ...locationValues,
      id: `loc-${crypto.randomUUID()}`,
      createdAt: now,
      createdBy: currentUserId,
      updatedAt: now,
      updatedBy: currentUserId,
    }

    setLocations((currentLocations) => [...currentLocations, newLocation])
    return newLocation
  }

  return { items, locations, createItem, createLocation }
}
