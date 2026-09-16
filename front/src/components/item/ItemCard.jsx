export const ItemCard = ({ item, onSelectItem }) => {
  const { title, quantity, locationPath, options = {} } = item
  const { unit, tags = [], note } = options

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">{title}</h3>
            {locationPath && <p className="mt-1 truncate text-sm text-slate-500">{locationPath}</p>}
          </div>
          {quantity !== undefined && (
            <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
              {quantity}
              {unit ? ` ${unit}` : ''}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="태그">
            {tags.map((tag) => (
              <li key={tag} className="rounded-md bg-violet-50 px-2 py-1 text-xs text-violet-700">
                {tag}
              </li>
            ))}
          </ul>
        )}

        {note && <p className="mt-3 text-sm text-slate-600">{note}</p>}
      </div>

      <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
        <button
          type="button"
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          onClick={() => onSelectItem(item.id)}
        >
          상세 보기
        </button>
      </div>
    </article>
  )
}
