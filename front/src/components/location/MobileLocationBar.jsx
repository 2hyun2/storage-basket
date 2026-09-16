import { getLocationPath } from '../../utils/location'

export const MobileLocationBar = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onOpenLocationForm,
  onOpenLocationManage,
}) => (
  <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 md:hidden">
    <label className="min-w-0 flex-1">
      <span className="sr-only">위치 선택</span>
      <select
        value={selectedLocationId ?? ''}
        onChange={(event) => onSelectLocation(event.target.value || null)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      >
        <option value="">전체 위치</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {getLocationPath(location.id, locations)}
          </option>
        ))}
      </select>
    </label>
    {selectedLocationId && (
      <button
        type="button"
        className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
        onClick={() => onOpenLocationManage(selectedLocationId)}
      >
        관리
      </button>
    )}
    <button
      type="button"
      className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
      onClick={onOpenLocationForm}
    >
      + 위치
    </button>
  </div>
)
