import { useEffect, useMemo, useState } from 'react'
import { getDescendantLocationIds, getLocationPath } from '../../utils/location'

export const LocationManageModal = ({
  location,
  locations,
  items,
  onUpdateLocation,
  onDeleteLocation,
  onDeleteLocationWithItemMoves,
  onAfterDelete,
  onClose,
}) => {
  const [name, setName] = useState(location.name)
  const [parentId, setParentId] = useState(location.parentId ?? '')
  const [errors, setErrors] = useState({})
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const [itemDestinationIds, setItemDestinationIds] = useState({})
  const [deleteErrors, setDeleteErrors] = useState({})

  const descendantIds = useMemo(
    () => getDescendantLocationIds(location.id, locations),
    [location.id, locations],
  )
  const availableParents = locations.filter((candidate) => !descendantIds.has(candidate.id))
  const childCount = locations.filter((candidate) => candidate.parentId === location.id).length
  const locationItems = items.filter((item) => item.locationId === location.id)
  const itemCount = locationItems.length
  const availableDestinations = locations.filter((candidate) => candidate.id !== location.id)
  const canDelete = childCount === 0

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
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
    if (parentId && !availableParents.some((candidate) => candidate.id === parentId)) {
      nextErrors.parentId = '자신 또는 하위 위치 아래로는 옮길 수 없어요.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    try {
      await onUpdateLocation(location.id, { name: trimmedName, parentId: parentId || null })
      onClose()
    } catch (error) { setErrors({ submit: error.message }) }
  }

  const handleDelete = async () => {
    const nextDeleteErrors = Object.fromEntries(
      locationItems
        .filter((item) => !itemDestinationIds[item.id])
        .map((item) => [item.id, '새 위치를 선택하세요.']),
    )

    if (Object.keys(nextDeleteErrors).length > 0) {
      setDeleteErrors(nextDeleteErrors)
      return
    }

    try {
      if (itemCount > 0) await onDeleteLocationWithItemMoves(location.id, itemDestinationIds)
      else await onDeleteLocation(location.id)
      onAfterDelete(location.parentId)
      onClose()
    } catch (error) { setDeleteErrors({ submit: error.message }) }
  }

  const handleItemDestinationChange = (itemId, destinationId) => {
    setItemDestinationIds((current) => ({ ...current, [itemId]: destinationId }))
    setDeleteErrors((current) => ({ ...current, [itemId]: undefined }))
  }

  const assignAllItems = (destinationId) => {
    setItemDestinationIds(Object.fromEntries(locationItems.map((item) => [item.id, destinationId])))
    setDeleteErrors({})
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 md:items-center md:justify-center md:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="위치 관리"
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl md:max-w-lg md:rounded-2xl md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">위치 관리</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{location.name}</h2>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="위치 관리 닫기"
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
              {availableParents.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {getLocationPath(candidate.id, locations)}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              자신과 하위 위치는 순환 구조를 막기 위해 선택할 수 없어요.
            </span>
            {errors.parentId && <span className="mt-1 block text-xs font-normal text-red-600">{errors.parentId}</span>}
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
            {errors.submit && <span className="mr-auto self-center text-xs text-red-600">{errors.submit}</span>}
            <button type="button" className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">
              저장
            </button>
          </div>
        </form>

        <section className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-900">위치 삭제</h3>
          {canDelete ? (
            <>
              <p className="mt-1 text-sm text-slate-600">
                {itemCount > 0
                  ? `물건 ${itemCount}개를 새 위치로 옮긴 뒤 이 위치를 삭제할 수 있어요.`
                  : '하위 위치와 물건이 없는 빈 위치라 삭제할 수 있어요.'}
              </p>
              {isDeleteConfirming ? (
                <div className="mt-3 rounded-lg bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-800">
                    {itemCount > 0 ? '물건을 옮긴 뒤 위치를 삭제합니다.' : `“${location.name}” 위치를 삭제할까요?`}
                  </p>
                  {itemCount > 0 && (
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-medium text-slate-700">
                        모두 같은 위치로 이동
                        <select
                          defaultValue=""
                          className={inputClassName(false)}
                          onChange={(event) => assignAllItems(event.target.value)}
                        >
                          <option value="">물건별로 직접 선택</option>
                          {availableDestinations.map((destination) => (
                            <option key={destination.id} value={destination.id}>
                              {getLocationPath(destination.id, locations)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <ul className="max-h-56 space-y-2 overflow-y-auto">
                        {locationItems.map((item) => (
                          <li key={item.id} className="rounded-lg border border-red-100 bg-white p-3">
                            <label className="block text-sm font-medium text-slate-800">
                              {item.title}
                              <span className="ml-1 font-normal text-slate-500">
                                · {item.quantity} {item.options?.unit ?? '개'}
                              </span>
                              <select
                                value={itemDestinationIds[item.id] ?? ''}
                                className={inputClassName(deleteErrors[item.id])}
                                onChange={(event) => handleItemDestinationChange(item.id, event.target.value)}
                              >
                                <option value="">새 위치 선택</option>
                                {availableDestinations.map((destination) => (
                                  <option key={destination.id} value={destination.id}>
                                    {getLocationPath(destination.id, locations)}
                                  </option>
                                ))}
                              </select>
                              {deleteErrors[item.id] && (
                                <span className="mt-1 block text-xs font-normal text-red-600">{deleteErrors[item.id]}</span>
                              )}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    {deleteErrors.submit && <span className="mr-auto self-center text-xs text-red-600">{deleteErrors.submit}</span>}
                    <button type="button" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white" onClick={() => setIsDeleteConfirming(false)}>
                      취소
                    </button>
                    <button type="button" className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700" onClick={handleDelete}>
                      {itemCount > 0 ? '이동 후 삭제' : '삭제'}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => setIsDeleteConfirming(true)}>
                  위치 삭제
                </button>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              하위 위치 {childCount}개가 남아 있어 삭제할 수 없어요. 먼저 하위 위치를 이동하거나 정리해 주세요.
            </p>
          )}
        </section>
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
