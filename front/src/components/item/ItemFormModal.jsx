import { useEffect, useState } from 'react'
import { getLocationPath } from '../../utils/location'

const initialFormValues = {
  title: '',
  quantity: '1',
  unit: '개',
  locationId: '',
  category: '',
  tags: '',
  note: '',
}

export const ItemFormModal = ({ locations, onCreateItem, onClose }) => {
  const [formValues, setFormValues] = useState(initialFormValues)
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

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validateForm(formValues, locations)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onCreateItem({
      title: formValues.title.trim(),
      quantity: Number(formValues.quantity),
      locationId: formValues.locationId,
      options: {
        unit: formValues.unit.trim(),
        category: formValues.category.trim(),
        tags: parseTags(formValues.tags),
        note: formValues.note.trim(),
      },
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 md:items-center md:justify-center md:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="물건 등록"
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl md:max-h-[80dvh] md:max-w-lg md:rounded-2xl md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">새 물건</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">물건 등록</h2>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="물건 등록 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField label="물건명" error={errors.title}>
            <input
              name="title"
              value={formValues.title}
              onChange={handleChange}
              maxLength={100}
              autoFocus
              className={inputClassName(errors.title)}
              placeholder="예: AA 건전지"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="수량" error={errors.quantity}>
              <input
                type="number"
                name="quantity"
                value={formValues.quantity}
                onChange={handleChange}
                min="1"
                step="1"
                className={inputClassName(errors.quantity)}
              />
            </FormField>
            <FormField label="단위" error={errors.unit}>
              <input
                name="unit"
                value={formValues.unit}
                onChange={handleChange}
                maxLength={20}
                className={inputClassName(errors.unit)}
                placeholder="개"
              />
            </FormField>
          </div>

          <FormField label="보관 위치" error={errors.locationId}>
            <select
              name="locationId"
              value={formValues.locationId}
              onChange={handleChange}
              className={inputClassName(errors.locationId)}
            >
              <option value="">위치를 선택하세요</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {getLocationPath(location.id, locations)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="카테고리" error={errors.category}>
            <input
              name="category"
              value={formValues.category}
              onChange={handleChange}
              maxLength={30}
              className={inputClassName(errors.category)}
              placeholder="예: 생활용품"
            />
          </FormField>

          <FormField label="태그" hint="쉼표(,)로 구분해 입력하세요." error={errors.tags}>
            <input
              name="tags"
              value={formValues.tags}
              onChange={handleChange}
              maxLength={300}
              className={inputClassName(errors.tags)}
              placeholder="예: 예비품, 캠핑"
            />
          </FormField>

          <FormField label="메모" error={errors.note}>
            <textarea
              name="note"
              value={formValues.note}
              onChange={handleChange}
              maxLength={1000}
              rows={3}
              className={inputClassName(errors.note)}
              placeholder="필요한 메모를 입력하세요."
            />
          </FormField>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
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
              등록
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

const FormField = ({ label, hint, error, children }) => (
  <label className="block text-sm font-medium text-slate-700">
    {label}
    {children}
    {error ? (
      <span className="mt-1 block text-xs font-normal text-red-600">{error}</span>
    ) : (
      hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>
    )}
  </label>
)

const inputClassName = (hasError) =>
  `mt-1.5 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-200 focus:border-violet-400 focus:ring-violet-100'
  }`

const validateForm = (formValues, locations) => {
  const errors = {}
  const title = formValues.title.trim()
  const unit = formValues.unit.trim()
  const category = formValues.category.trim()
  const note = formValues.note.trim()
  const quantity = Number(formValues.quantity)
  const tags = parseTags(formValues.tags)

  if (!title) errors.title = '물건명을 입력하세요.'
  if (title.length > 100) errors.title = '물건명은 100자 이내여야 해요.'
  if (!Number.isFinite(quantity) || quantity <= 0) errors.quantity = '0보다 큰 수량을 입력하세요.'
  if (!unit) errors.unit = '단위를 입력하세요.'
  if (unit.length > 20) errors.unit = '단위는 20자 이내여야 해요.'
  if (!locations.some((location) => location.id === formValues.locationId)) {
    errors.locationId = '목록에 있는 위치를 선택하세요.'
  }
  if (tags.length > 10) errors.tags = '태그는 최대 10개까지 입력할 수 있어요.'
  if (tags.some((tag) => tag.length > 30)) errors.tags = '태그 하나는 30자 이내여야 해요.'
  if (category.length > 30) errors.category = '카테고리는 30자 이내여야 해요.'
  if (note.length > 1000) errors.note = '메모는 1,000자 이내여야 해요.'

  return errors
}

const parseTags = (tagInput) =>
  [...new Set(tagInput.split(',').map((tag) => tag.trim()).filter(Boolean))]
