export const Header = ({ searchKeyword, onSearchKeywordChange }) => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-violet-600 text-lg font-bold text-white">
          수
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-slate-900">
            수납바구니
          </h1>
          <p className="text-xs text-slate-500">우리 집 물건 찾기</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="hidden sm:block">
          <span className="sr-only">물건 검색</span>
          <input
            type="search"
            value={searchKeyword}
            onChange={(event) => onSearchKeywordChange(event.target.value)}
            placeholder="물건, 태그, 위치 검색"
            className="w-52 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-64"
          />
        </label>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          내 공간
        </button>
      </div>
    </header>
  )
}
