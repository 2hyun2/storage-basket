import { LocationTreeNode } from './LocationTreeNode'

export const LocationTree = ({ locations, selectedLocationId, onSelectLocation }) => {
  const rootLocations = locations.filter((location) => location.parentId === null)

  if (rootLocations.length === 0) {
    return <p className="rounded-lg px-3 py-2 text-sm text-slate-500">아직 등록된 위치가 없어요.</p>
  }

  return (
    <ul className="space-y-1" aria-label="위치 목록">
      {rootLocations.map((location) => (
        <LocationTreeNode
          key={location.id}
          location={location}
          locations={locations}
          selectedLocationId={selectedLocationId}
          onSelectLocation={onSelectLocation}
        />
      ))}
    </ul>
  )
}
