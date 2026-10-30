'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Package, X } from 'lucide-react'
import type { LocalItem } from '@/lib/space/local-items'
import { invalidateHomeInventory, useSupabaseInventory } from '@/lib/space/use-supabase-inventory'
import { createClient } from '@/lib/supabase/client'

type ItemEditorDialogProps = {
  item?: LocalItem
  initialLocationId?: string
  onClose: () => void
}

export function ItemEditorDialog({
  item,
  initialLocationId,
  onClose,
}: ItemEditorDialogProps) {
  const queryClient = useQueryClient()
  const { homeId, items, spaces } = useSupabaseInventory()
  const [title, setTitle] = useState(item?.title ?? '')
  const [locationId, setLocationId] = useState(item?.locationId ?? initialLocationId ?? '')
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1))
  const [unit, setUnit] = useState(item?.unit ?? '')
  const [category, setCategory] = useState(item?.category ?? '')
  const [note, setNote] = useState(item?.note ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const locations = useMemo(
    () => buildLocationOptions(spaces),
    [spaces],
  )
  const categories = useMemo(
    () => [...new Set(items.map((entry) => entry.category).filter((entry): entry is string => Boolean(entry)))],
    [items],
  )

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedTitle = title.trim()
    const normalizedCategory = category.trim()
    const normalizedUnit = unit.trim()
    const normalizedNote = note.trim()
    const parsedQuantity = Number(quantity)

    if (!homeId) {
      setMessage('현재 공동체 정보를 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    if (!normalizedTitle) {
      setMessage('물건 이름을 입력해 주세요.')
      return
    }

    if (!locationId || !spaces.some((space) => space.id === locationId)) {
      setMessage('물건을 보관할 공간을 선택해 주세요.')
      return
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      setMessage('수량은 0 이상의 숫자로 입력해 주세요.')
      return
    }

    setIsSaving(true)
    setMessage(null)

    const values = {
      location_id: locationId,
      title: normalizedTitle,
      quantity: parsedQuantity,
      unit: normalizedUnit || null,
      category: normalizedCategory || null,
      note: normalizedNote || null,
    }
    const supabase = createClient()
    const { error } = item
      ? await supabase.from('items').update(values).eq('id', item.id)
      : await supabase.from('items').insert({ home_id: homeId, ...values })

    setIsSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }

    await invalidateHomeInventory(queryClient)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={item ? '물건 수정' : '물건 등록'}>
      <form onSubmit={saveItem} className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700">
              <Package size={19} />
            </span>
            <div>
              <p className="text-sm font-bold text-sky-700">물건 기록</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{item ? '물건 정보 수정' : '물건 등록'}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="물건 등록 창 닫기">
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 rounded-xl bg-sky-50 px-3 py-2 text-sm leading-6 text-sky-900">
          물건은 3D 좌표 없이 보관 공간에만 연결됩니다. 위치를 바꾸면 물건 이동 기록으로 사용할 수 있습니다.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="물건 이름" value={title} onChange={setTitle} placeholder="예: AA 건전지" required className="sm:col-span-2" />
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">보관 공간</span>
            <select
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            >
              <option value="">공간을 선택해 주세요</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.label}</option>
              ))}
            </select>
          </label>
          <Field label="수량" value={quantity} onChange={setQuantity} type="number" min="0" step="any" required />
          <Field label="단위" value={unit} onChange={setUnit} placeholder="예: 개, 장, 벌" />
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">카테고리</span>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              list="item-category-options"
              maxLength={60}
              placeholder="직접 입력 · 예: 주방용품"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
            <datalist id="item-category-options">
              {categories.map((entry) => <option key={entry} value={entry} />)}
            </datalist>
            <span className="mt-1.5 block text-xs leading-5 text-slate-500">카테고리는 미리 정해 두지 않고 직접 입력합니다. 입력한 값은 이후 필터에 나타납니다.</span>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">메모</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="예: 리모컨 교체용 여분"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
          </label>
        </div>

        {message && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{message}</p>}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">취소</button>
          <button disabled={isSaving || locations.length === 0} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300">
            {isSaving ? '저장 중...' : item ? '수정 저장' : '등록'}
          </button>
        </div>
        {locations.length === 0 && <p className="mt-3 text-xs font-bold text-rose-700">물건을 등록하려면 먼저 보관 공간을 하나 만들어 주세요.</p>}
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  step,
  required = false,
  className = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number'
  min?: string
  step?: string
  required?: boolean
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        min={min}
        step={step}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  )
}

function buildLocationOptions(spaces: Array<{ id: string; name: string; parentId: string | null }>) {
  const spacesById = new Map(spaces.map((space) => [space.id, space]))

  return spaces.map((space) => {
    const names: string[] = []
    let current: typeof space | undefined = space

    while (current) {
      names.unshift(current.name)
      current = current.parentId ? spacesById.get(current.parentId) : undefined
    }

    return {
      id: space.id,
      label: names.join(' › '),
    }
  }).sort((left, right) => left.label.localeCompare(right.label, 'ko'))
}
