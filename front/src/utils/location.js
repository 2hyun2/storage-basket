export const getLocationPath = (locationId, locations) => {
  const path = []
  let currentLocation = locations.find((location) => location.id === locationId)

  while (currentLocation) {
    path.unshift(currentLocation.name)
    currentLocation = locations.find((location) => location.id === currentLocation.parentId)
  }

  return path.join(' > ')
}
