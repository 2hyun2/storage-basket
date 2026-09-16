import { useMemo } from 'react'

// 위치 선택, 검색어, 정렬 방식으로 목록을 계산하는 읽기 전용 규칙이다.
export const useVisibleItems = ({ items, locations, selectedLocationId, searchKeyword, sortOption }) =>
  useMemo(() => {
    const includedLocationIds = selectedLocationId
      ? getLocationAndDescendantIds(selectedLocationId, locations)
      : null
    const locationFilteredItems = includedLocationIds
      ? items.filter((item) => includedLocationIds.includes(item.locationId))
      : items
    const searchedItems = locationFilteredItems.filter((item) => matchesSearch(item, searchKeyword))

    return sortItems(searchedItems, sortOption)
  }, [items, locations, searchKeyword, selectedLocationId, sortOption])

const matchesSearch = (item, searchKeyword) => {
  const normalizedKeyword = searchKeyword.trim().toLocaleLowerCase()

  if (!normalizedKeyword) return true

  const { category, note, tags = [] } = item.options
  const searchableText = [item.title, item.locationPath, category, note, ...tags]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()

  return searchableText.includes(normalizedKeyword)
}

const sortItems = (itemsToSort, sortOption) => {
  const copiedItems = [...itemsToSort]

  return copiedItems.sort((a, b) => {
    switch (sortOption) {
      case 'created-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'title-asc':
        return a.title.localeCompare(b.title, 'ko')
      case 'quantity-desc':
        return b.quantity - a.quantity
      case 'updated-desc':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })
}

const getLocationAndDescendantIds = (locationId, locations) => {
  const locationIds = [locationId]
  const pendingParentIds = [locationId]

  while (pendingParentIds.length > 0) {
    const parentId = pendingParentIds.pop()
    const children = locations.filter((location) => location.parentId === parentId)

    children.forEach((child) => {
      locationIds.push(child.id)
      pendingParentIds.push(child.id)
    })
  }

  return locationIds
}
