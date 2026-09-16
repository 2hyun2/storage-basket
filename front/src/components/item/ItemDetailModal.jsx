import { useEffect } from 'react'

export const ItemDetailModal = ({ item, createdByName, updatedByName, onClose }) => {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const { title, quantity, locationPath, options = {}, createdAt, updatedAt } = item
  const { unit, category, tags = [], note } = options

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 md:items-center md:justify-center md:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${title} 상세 보기`}
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl md:max-h-[80dvh] md:max-w-lg md:rounded-2xl md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">물건 상세</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="상세 보기 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <dl className="mt-6 space-y-4 text-sm">
          <DetailRow label="수량" value={`${quantity}${unit ? ` ${unit}` : ''}`} />
          <DetailRow label="보관 위치" value={locationPath} />
          {category && <DetailRow label="카테고리" value={category} />}
          {tags.length > 0 && (
            <div>
              <dt className="font-medium text-slate-500">태그</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-violet-50 px-2 py-1 text-xs text-violet-700">
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {note && <DetailRow label="메모" value={note} />}
        </dl>

        <section className="mt-8 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-900">기록 정보</h3>
          <dl className="mt-3 space-y-3 text-sm">
            <DetailRow label="최초 등록" value={`${formatDateTime(createdAt)} · ${createdByName}`} />
            <DetailRow label="마지막 수정" value={`${formatDateTime(updatedAt)} · ${updatedByName}`} />
          </dl>
        </section>
      </section>
    </div>
  )
}

const DetailRow = ({ label, value }) => (
  <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
    <dt className="font-medium text-slate-500">{label}</dt>
    <dd className="break-words text-slate-900">{value}</dd>
  </div>
)

const formatDateTime = (dateTime) =>
  new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateTime))
