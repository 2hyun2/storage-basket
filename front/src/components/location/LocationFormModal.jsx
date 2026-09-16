import { useEffect, useState } from 'react'
import { getLocationPath } from '../../utils/location'

export const LocationFormModal = ({ locations, initialParentId, onCreateLocation, onClose }) => {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState(initialParentId ?? '')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const nextErrors = {}

    if (!trimmedName) nextErrors.name = '위치명을 입력하세요.'
    if (trimmedName.length > 100) nextErrors.name = '위치명은 100자 이내여야 해요.'
    if (parentId && !locations.some((location) => location.id === parentId)) {
      nextErrors.parentId = '목록에 있는 상위 위치를 선택하세요.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    try {
      await onCreateLocation({ name: trimmedName, parentId: parentId || null })
      onClose()
    } catch (error) { setErrors({ submit: error.message }) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 md:items-center md:justify-center md:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="위치 추가"
        className="w-full rounded-t-2xl bg-white p-5 shadow-xl md:max-w-lg md:rounded-2xl md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">새 위치</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">위치 추가</h2>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="위치 추가 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <label className="block text-sm font-medium text-slate-700">
            위치명
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              autoFocus
              className={inputClassName(errors.name)}
              placeholder="예: 오른쪽 서랍"
            />
            {errors.name && <span className="mt-1 block text-xs font-normal text-red-600">{errors.name}</span>}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            상위 위치
            <select
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              className={inputClassName(errors.parentId)}
            >
              <option value="">최상위 위치</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {getLocationPath(location.id, locations)}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              최상위 위치를 선택하면 집의 첫 번째 공간으로 추가됩니다.
            </span>
            {errors.parentId && (
              <span className="mt-1 block text-xs font-normal text-red-600">{errors.parentId}</span>
            )}
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
            {errors.submit && <span className="mr-auto self-center text-xs text-red-600">{errors.submit}</span>}
            <button
              type="button"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              추가
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

const inputClassName = (hasError) =>
  `mt-1.5 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-200 focus:border-violet-400 focus:ring-violet-100'
  }`
