import { useState } from 'react'

export const LocationTreeNode = ({
  location,
  locations,
  selectedLocationId,
  onSelectLocation,
}) => {
  const children = locations.filter((child) => child.parentId === location.id)
  const hasChildren = children.length > 0
  const [isExpanded, setIsExpanded] = useState(true)
  const isSelected = selectedLocationId === location.id

  return (
    <li>
      <div className="flex items-center gap-1">
        {hasChildren ? (
          <button
            type="button"
            className="grid size-6 shrink-0 place-items-center rounded text-xs text-slate-500 hover:bg-slate-100"
            aria-label={`${location.name} ${isExpanded ? '접기' : '펼치기'}`}
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? '⌄' : '›'}
          </button>
        ) : (
          <span className="size-6 shrink-0" />
        )}

        <button
          type="button"
          className={`min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm transition ${
            isSelected
              ? 'bg-violet-100 font-medium text-violet-800'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          onClick={() => onSelectLocation?.(location.id)}
        >
          <span className="block truncate">{location.name}</span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul className="ml-3 border-l border-slate-200 pl-2">
          {children.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              locations={locations}
              selectedLocationId={selectedLocationId}
              onSelectLocation={onSelectLocation}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
