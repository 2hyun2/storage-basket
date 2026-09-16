import { ItemList } from '../item/ItemList'

export const Content = ({
  items = [],
  selectedLocationName,
  searchKeyword,
  sortOption,
  onSortOptionChange,
  onSelectItem,
  onOpenItemForm,
}) => {
  const title = selectedLocationName ? `${selectedLocationName}의 물건` : '전체 물건'
  const description = searchKeyword
    ? `“${searchKeyword}” 검색 결과 ${items.length}개`
    : '물건의 이름과 보관 위치를 기록하면 언제든 쉽게 찾을 수 있어요.'

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-600">내 수납 공간</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            <label>
              <span className="sr-only">물건 정렬</span>
              <select
                value={sortOption}
                onChange={(event) => onSortOptionChange(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                <option value="updated-desc">최근 수정 순</option>
                <option value="created-desc">최근 등록 순</option>
                <option value="title-asc">이름 가나다순</option>
                <option value="quantity-desc">수량 많은 순</option>
              </select>
            </label>
            <button
              type="button"
              className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
              onClick={onOpenItemForm}
            >
              + 물건 등록
            </button>
          </div>
        </section>

        <ItemList items={items} onSelectItem={onSelectItem} />
      </div>
    </main>
  )
}
