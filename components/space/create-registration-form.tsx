'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Box,
  ChevronRight,
  History,
  House,
  MapPinned,
  Package,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDefaultSpaceColor, normalizeSpaceColor } from '@/lib/space/colors'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'

type RegistrationTarget = 'space' | 'item'

export function CreateRegistrationForm() {
  const searchParams = useSearchParams()
  const [target, setTarget] = useState<RegistrationTarget>(() => (
    searchParams.get('kind') === 'item' ? 'item' : 'space'
  ))
  const [selectedParentId, setSelectedParentId] = useState<string | null>(() => searchParams.get('inside'))
  const [message, setMessage] = useState<string | null>(null)
  const [spaceColor, setSpaceColor] = useState<string>(getDefaultSpaceColor())
  const { homeId, homeLayout, spaces, refresh, isLoading } = useSupabaseInventory()
  const router = useRouter()

  const spaceParentOptions = useMemo(
    () => spaces.map((space) => ({ value: space.id, label: space.name })),
    [spaces],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const submittedParentId = String(formData.get('parentId') ?? '')
    const parentId = submittedParentId || null
    const colorHex = normalizeSpaceColor(spaceColor)

    if (!homeId || (parentId && !spaces.some((space) => space.id === parentId))) {
      setMessage('선택한 위치를 찾을 수 없습니다. 다시 선택해 주세요.')
      return
    }

    if (isSpace && !homeLayout) {
      setMessage('먼저 공간 화면에서 집 전체 크기를 설정해 주세요.')
      return
    }

    if (!name) {
      setMessage(isSpace ? '공간 이름을 입력해 주세요.' : '물건 이름을 입력해 주세요.')
      return
    }

    if (!isSpace && !parentId) {
      setMessage('물건을 보관할 공간을 선택해 주세요.')
      return
    }

    if (isSpace && spaces.some((space) => space.parentId === parentId && space.name === name)) {
      setMessage('같은 위치 안에는 같은 이름의 공간을 만들 수 없습니다.')
      return
    }

    if (isSpace && !colorHex) {
      setMessage('공간 색상은 #RRGGBB 형식으로 입력해 주세요.')
      return
    }

    const supabase = createClient()
    const result = isSpace
      ? await supabase
          .from('locations')
          .insert({ home_id: homeId, parent_id: parentId, name, color_hex: colorHex })
          .select('id')
          .single()
      : await supabase.from('items').insert({
        home_id: homeId,
        location_id: parentId,
        title: name,
        quantity: Number(formData.get('quantity') ?? 1),
        unit: String(formData.get('unit') ?? '') || null,
        category: String(formData.get('category') ?? '').trim() || null,
        note: String(formData.get('note') ?? '').trim() || null,
      })

    if (result.error) {
      setMessage(result.error.code === '23505' ? '같은 위치 안에는 같은 이름의 공간을 만들 수 없습니다.' : result.error.message)
      return
    }

    await refresh()
    router.push(isSpace ? '/app/space' : '/app/items')
  }

  const isSpace = target === 'space'
  if (!isLoading && !homeLayout) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-5 text-sm leading-6 text-violet-900">
        공간을 만들기 전에 먼저 공간 화면에서 집 전체 크기를 설정해 주세요.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section>
        <SectionTitle icon={Box} title="무엇을 등록할까요?" description="공간은 계층과 지도를 만들고, 물건은 특정 공간에 보관됩니다." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            selected={isSpace}
            icon={MapPinned}
            title="공간 등록"
            description="방, 수납장, 서랍, 상자처럼 다른 것을 담는 구조"
            onClick={() => {
              setTarget('space')
              setMessage(null)
            }}
          />
          <ChoiceCard
            selected={!isSpace}
            icon={Package}
            title="물건 등록"
            description="수량과 보관 공간을 기록하는 실제 물건"
            onClick={() => {
              setTarget('item')
              setMessage(null)
            }}
          />
        </div>
      </section>

      {!isSpace && (
        <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
          물건에는 좌표와 크기를 입력하지 않습니다. 보관 공간을 지정하면 해당 공간의 물건 목록에서 확인할 수 있습니다.
        </p>
      )}

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
          {isSpace ? '공간 정보' : '물건 정보'}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="이름" name="name" placeholder={isSpace ? '예: 오른쪽 서랍' : '예: AA 건전지'} />
          {isSpace ? <SpaceParentSelector spaces={spaces} value={selectedParentId} onChange={setSelectedParentId} /> : (
            <SelectField label="보관 공간" name="parentId" options={spaceParentOptions} />
          )}
          {!isSpace && <Field label="수량" name="quantity" type="number" min="0" defaultValue="1" />}
          {!isSpace && <Field label="단위" name="unit" placeholder="예: 개" required={false} />}
          {!isSpace && <Field label="카테고리" name="category" placeholder="직접 입력 · 예: 생활용품" required={false} />}
          {!isSpace && <Field label="메모" name="note" placeholder="예: 여분 보관용" required={false} />}
        </div>

        {isSpace && <SpaceColorField value={spaceColor} onChange={setSpaceColor} />}

        {isSpace && (
          <p className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm leading-6 text-violet-900">
            등록 후 이 공간이 들어갈 곳의 <strong>3D 자리 정하기</strong>에서 실제 위치와 크기를 정합니다.
          </p>
        )}
      </section>

      {message && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700">
          {message}
        </p>
      )}

      <button className="w-full rounded-2xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">
        등록 내용 확인
      </button>
    </form>
  )
}

function SpaceColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-slate-900">공간 색상</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">3D와 공간 목록에서 이 공간을 구분하는 색입니다.</p>
        </div>
        <input
          type="color"
          value={normalizeSpaceColor(value) ?? getDefaultSpaceColor()}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label="공간 색상 선택"
          className="size-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
        />
      </div>
      <label className="mt-3 block">
        <span className="sr-only">HEX 색상값</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          placeholder="#8B5CF6"
          maxLength={7}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm font-bold uppercase outline-none focus:border-violet-500"
        />
      </label>
    </div>
  )
}

type SpaceParentSelectorProps = {
  spaces: Array<{ id: string; name: string; parentId: string | null; createdAt: string }>
  value: string | null
  onChange: (parentId: string | null) => void
}

function SpaceParentSelector({ spaces, value, onChange }: SpaceParentSelectorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  const spacesById = useMemo(
    () => new Map(spaces.map((space) => [space.id, space])),
    [spaces],
  )
  const selectedPath = getSpacePath(value, spacesById)
  const recentSpaces = [...spaces]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 5)

  const childrenByParent = useMemo(() => {
    const entries = new Map<string | null, SpaceParentSelectorProps['spaces']>()

    for (const space of spaces) {
      const siblings = entries.get(space.parentId) ?? []
      siblings.push(space)
      entries.set(space.parentId, siblings)
    }

    return entries
  }, [spaces])

  function selectParent(parentId: string | null) {
    onChange(parentId)

    if (parentId) {
      setExpandedIds((current) => new Set([
        ...current,
        ...getSpacePath(parentId, spacesById).map((space) => space.id),
      ]))
    }
  }

  function toggleExpanded(spaceId: string) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(spaceId)) {
        next.delete(spaceId)
      } else {
        next.add(spaceId)
      }
      return next
    })
  }

  function renderSpace(space: SpaceParentSelectorProps['spaces'][number], depth: number): ReactNode {
    const children = childrenByParent.get(space.id) ?? []
    const hasChildren = children.length > 0
    const isExpanded = expandedIds.has(space.id)
    const isSelected = value === space.id

    return (
      <li key={space.id}>
        <div className="flex min-w-0 items-center gap-1" style={{ paddingLeft: `${depth * 14}px` }}>
          {depth > 0 && <span aria-hidden="true" className="shrink-0 text-sm font-bold text-slate-400">└</span>}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpanded(space.id)}
              aria-label={`${space.name} 안에 있는 공간 ${isExpanded ? '접기' : '펼치기'}`}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-violet-700"
            >
              <ChevronRight size={16} className={`transition ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          ) : <span className="size-7 shrink-0" />}
          <button
            type="button"
            onClick={() => selectParent(space.id)}
            className={`min-w-0 flex-1 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${isSelected ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-700 hover:bg-violet-50 hover:text-violet-800'}`}
          >
            <span className="block truncate">{space.name}</span>
          </button>
        </div>
        {hasChildren && isExpanded && <ul className="mt-1 space-y-1">{children.map((child) => renderSpace(child, depth + 1))}</ul>}
      </li>
    )
  }

  return (
    <div className="sm:col-span-2">
      <input type="hidden" name="parentId" value={value ?? ''} />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">공간을 넣을 곳</span>
        <span className="text-xs font-medium text-slate-400">공간 이름을 누르면 바로 선택</span>
      </div>

      <div className="mt-1.5 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-bold text-slate-500">선택한 위치</p>
        <div className="mt-1 flex flex-wrap items-center gap-1 text-sm font-extrabold text-violet-800">
          <House size={15} />
          <span>우리 집</span>
          {selectedPath.map((space) => (
            <span key={space.id} className="inline-flex items-center gap-1">
              <ChevronRight size={14} className="text-slate-400" />
              {space.name}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-slate-100 p-2">
        <button
          type="button"
          onClick={() => selectParent(null)}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-extrabold transition ${value === null ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-700 hover:bg-violet-50 hover:text-violet-800'}`}
        >
          <House size={16} /> 우리 집에 넣기
        </button>
        {spaces.length > 0 ? (
          <ul className="mt-2 space-y-1">{(childrenByParent.get(null) ?? []).map((space) => renderSpace(space, 0))}</ul>
        ) : (
          <p className="px-3 py-3 text-sm text-slate-500">아직 등록된 공간이 없습니다.</p>
        )}
      </div>

      {recentSpaces.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <History size={14} />
            최근 등록한 공간
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentSpaces.map((space) => (
              <button
                key={space.id}
                type="button"
                onClick={() => selectParent(space.id)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
              >
                {getSpacePath(space.id, spacesById).map((entry) => entry.name).join(' › ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getSpacePath<T extends { id: string; parentId: string | null }>(
  spaceId: string | null,
  spacesById: Map<string, T>,
) {
  const path: T[] = []
  let currentId = spaceId

  while (currentId) {
    const space = spacesById.get(currentId)

    if (!space) {
      break
    }

    path.unshift(space)
    currentId = space.parentId
  }

  return path
}

type ChoiceCardProps = {
  selected: boolean
  icon: typeof Box
  title: string
  description: string
  onClick: () => void
}

function ChoiceCard({ selected, icon: Icon, title, description, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-violet-500 bg-violet-50 ring-4 ring-violet-100' : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40'}`}
    >
      <span className={`grid size-9 place-items-center rounded-xl ${selected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
        <Icon size={18} />
      </span>
      <span className="mt-4 block text-sm font-extrabold text-slate-900">{title}</span>
      <span className="mt-1.5 block text-sm leading-6 text-slate-500">{description}</span>
    </button>
  )
}

type SectionTitleProps = {
  icon: typeof Box
  title: string
  description: string
}

function SectionTitle({ icon: Icon, title, description }: SectionTitleProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
        <Icon size={18} />
      </span>
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  )
}

type FieldProps = {
  label: string
  name: string
  placeholder?: string
  type?: 'text' | 'number'
  min?: string
  max?: string
  defaultValue?: string
  required?: boolean
}

function Field({ label, name, placeholder, type = 'text', min, max, defaultValue, required = true }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <input
        required={required}
        name={name}
        type={type}
        min={min}
        max={max}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  )
}

type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = {
  label: string
  name: string
  options: SelectOption[]
}

function SelectField({ label, name, options }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <select
        name={name}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
