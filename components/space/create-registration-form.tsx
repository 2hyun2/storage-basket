'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Box, ChevronRight, History } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDefaultSpaceColor, normalizeSpaceColor } from '@/lib/space/colors'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'

export function CreateRegistrationForm() {
  const searchParams = useSearchParams()
  const [selectedParentId, setSelectedParentId] = useState<string | null>(() => searchParams.get('inside'))
  const [message, setMessage] = useState<string | null>(null)
  const [spaceColor, setSpaceColor] = useState<string>(getDefaultSpaceColor())
  const { homeId, homeLayout, spaces, refresh, isLoading } = useSupabaseInventory()
  const router = useRouter()

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

    if (!homeLayout) {
      setMessage('먼저 공간 화면에서 집 전체 크기를 설정해 주세요.')
      return
    }

    if (!name) {
      setMessage('공간 이름을 입력해 주세요.')
      return
    }

    if (spaces.some((space) => space.parentId === parentId && space.name === name)) {
      setMessage('같은 위치 안에는 같은 이름의 공간을 만들 수 없습니다.')
      return
    }

    if (!colorHex) {
      setMessage('공간 색상은 #RRGGBB 형식으로 입력해 주세요.')
      return
    }

    const supabase = createClient()
    const result = await supabase
      .from('locations')
      .insert({ home_id: homeId, parent_id: parentId, name, color_hex: colorHex })
      .select('id')
      .single()

    if (result.error) {
      setMessage(result.error.code === '23505' ? '같은 위치 안에는 같은 이름의 공간을 만들 수 없습니다.' : result.error.message)
      return
    }

    await refresh()
    router.push('/app/space')
  }

  if (!isLoading && !homeLayout) {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-4 text-sm leading-6 text-violet-900">
        공간을 만들기 전에 먼저 공간 화면에서 집 전체 크기를 설정해 주세요.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <SectionTitle icon={Box} title="공간 정보" description="이름과 이 공간이 들어갈 곳을 정해 주세요." />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="공간 이름" name="name" placeholder="예: 오른쪽 서랍" />
          <SpaceParentSelector spaces={spaces} value={selectedParentId} onChange={setSelectedParentId} />
        </div>

        <SpaceColorField value={spaceColor} onChange={setSpaceColor} />

        <p className="mt-4 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm leading-6 text-violet-900">
          등록 후 이 공간이 들어갈 곳의 <strong>3D 자리 정하기</strong>에서 실제 위치와 크기를 정합니다.
        </p>
      </section>

      {message && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
          {message}
        </p>
      )}

      <button className="w-full rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">
        공간 등록
      </button>
    </form>
  )
}
function SpaceColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">공간 색상</p>
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

      <div className="mt-1.5 rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-bold text-slate-500">선택한 위치</p>
        <div className="mt-1 flex flex-wrap items-center gap-1 text-sm font-semibold text-violet-800">
          {selectedPath.length === 0 && <span>집의 가장 바깥 공간</span>}
          {selectedPath.map((space, index) => (
            <span key={space.id} className="inline-flex items-center gap-1">
              {index > 0 && <ChevronRight size={14} className="text-slate-400" />}
              {space.name}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-slate-100 p-2">
        <button
          type="button"
          onClick={() => selectParent(null)}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${value === null ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-700 hover:bg-violet-50 hover:text-violet-800'}`}
        >
          <Box size={16} /> 집의 가장 바깥 공간에 만들기
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
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
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
