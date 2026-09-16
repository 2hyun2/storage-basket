import { LocationTree } from '../location/LocationTree'

export const Sidebar = ({
  locations = [],
  selectedLocationId,
  onSelectLocation,
  onOpenLocationForm,
  onOpenLocationManage,
}) => {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <h2 className="text-sm font-semibold text-slate-900">위치</h2>
        <button
          type="button"
          className="grid size-7 place-items-center rounded-md text-lg leading-none text-violet-600 transition hover:bg-violet-50"
          aria-label="위치 추가"
          onClick={onOpenLocationForm}
        >
          +
        </button>
      </div>

      <nav className="px-3 pb-5">
        <LocationTree
          locations={locations}
          selectedLocationId={selectedLocationId}
          onSelectLocation={onSelectLocation}
        />
      </nav>

      {selectedLocationId && (
        <div className="px-4 pb-4">
          <button
            type="button"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            onClick={() => onOpenLocationManage(selectedLocationId)}
          >
            선택한 위치 관리
          </button>
        </div>
      )}

      <div className="mt-auto border-t border-slate-200 p-4">
        <button
          type="button"
          className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          onClick={onOpenLocationForm}
        >
          + 위치 추가
        </button>
      </div>
    </aside>
  )
}
