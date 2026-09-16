export const getLocationPath = (locationId, locations) => {
  const path = []
  let currentLocation = locations.find((location) => location.id === locationId)

  while (currentLocation) {
    path.unshift(currentLocation.name)
    currentLocation = locations.find((location) => location.id === currentLocation.parentId)
  }

  return path.join(' > ')
}

// 선택한 위치와 모든 하위 위치 ID를 찾아 이동 제한과 목록 필터에 공통으로 쓴다.
export const getDescendantLocationIds = (locationId, locations) => {
  const descendantIds = new Set([locationId])
  const pendingIds = [locationId]

  while (pendingIds.length > 0) {
    const parentId = pendingIds.pop()
    locations
      .filter((location) => location.parentId === parentId)
      .forEach((child) => {
        descendantIds.add(child.id)
        pendingIds.push(child.id)
      })
  }

  return descendantIds
}
