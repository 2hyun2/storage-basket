import { ItemCard } from './ItemCard'

export const ItemList = ({ items, onSelectItem }) => {
  if (items.length === 0) {
    return (
      <section className="mt-8 grid flex-1 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-50 text-2xl">◫</div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">아직 등록한 물건이 없어요</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            첫 물건을 등록하고, 어디에 보관했는지 기록해 보세요.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="물건 목록">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onSelectItem={onSelectItem} />
      ))}
    </section>
  )
}
