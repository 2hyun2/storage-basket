'use client'

import { useMemo, useState, type FormEvent } from 'react'
import {
  Box,
  ChevronRight,
  FolderInput,
  History,
  House,
  MapPinned,
  Package,
  Ruler,
  Type,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'
import { type SpacePlacement } from '@/lib/space/local-spaces'

type RegistrationTarget = 'space' | 'item'
type SpaceRegistrationMode = 'simple' | 'map'

export function CreateRegistrationForm() {
  const [target, setTarget] = useState<RegistrationTarget>('space')
  const [spaceMode, setSpaceMode] = useState<SpaceRegistrationMode>('simple')
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { homeId, homeLayout, spaces, refresh, isLoading } = useSupabaseInventory()
  const router = useRouter()

  const spaceParentOptions = useMemo(
    () => spaces.map((space) => ({ value: space.id, label: space.name })),
    [spaces],
  )

  if (!isLoading && !homeLayout) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-5 text-sm leading-6 text-violet-900">
        공간을 만들기 전에 먼저 공간 화면에서 집 전체 크기를 설정해 주세요.
      </div>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const submittedParentId = String(formData.get('parentId') ?? '')
    const parentId = submittedParentId || null

    if (!homeId || (parentId && !spaces.some((space) => space.id === parentId))) {
      setMessage('선택한 부모 공간을 찾을 수 없습니다. 다시 선택해 주세요.')
      return
    }

    if (isSpace && !homeLayout) {
      setMessage('먼저 공간 화면에서 집 전체 크기를 설정해 주세요.')
      return
    }

    if (!name || (isSpace && spaces.some((space) => space.parentId === parentId && space.name === name))) {
      setMessage('같은 부모 공간 아래에는 같은 이름의 공간을 만들 수 없습니다.')
      return
    }

    const placement = isMapRegistration ? getPlacement(formData) : null

    if (isMapRegistration && !placement) {
      setMessage('지도 배치 값은 0 이상의 정수 cm 좌표와 1cm 이상의 정수 크기로 입력해 주세요.')
      return
    }

    const supabase = createClient()
    const result = isSpace
      ? await supabase
          .from('locations')
          .insert({ home_id: homeId, parent_id: parentId, name })
          .select('id')
          .single()
      : await supabase.from('items').insert({
        home_id: homeId,
        location_id: parentId,
        title: name,
        quantity: Number(formData.get('quantity') ?? 1),
        unit: String(formData.get('unit') ?? '') || null,
      })

    if (result.error) {
      setMessage(result.error.code === '23505' ? '같은 부모 공간 아래에는 같은 이름의 공간을 만들 수 없습니다.' : result.error.message)
      return
    }

    if (isSpace && placement && result.data) {
      const layoutQuery = parentId
        ? supabase
            .from('space_layouts')
            .select('id, width_cm, height_cm, depth_cm')
            .eq('scene_location_id', parentId)
            .maybeSingle()
        : supabase
            .from('space_layouts')
            .select('id, width_cm, height_cm, depth_cm')
            .eq('home_id', homeId)
            .eq('layout_key', 'home')
            .maybeSingle()
      const { data: layout, error: layoutError } = await layoutQuery

      if (layoutError || !layout) {
        await supabase.from('locations').delete().eq('id', result.data.id)
        setMessage('부모 공간의 3D 장면이 없습니다. 먼저 부모 공간의 장면 크기를 등록해 주세요.')
        return
      }

      const { data: existingPlacements } = await supabase
        .from('space_placements')
        .select('x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm')
        .eq('layout_id', layout.id)

      const validationMessage = validatePlacement(
        placement,
        {
          widthCm: Number(layout.width_cm),
          heightCm: Number(layout.height_cm),
          depthCm: Number(layout.depth_cm),
        },
        existingPlacements ?? [],
      )

      if (validationMessage) {
        await supabase.from('locations').delete().eq('id', result.data.id)
        setMessage(validationMessage)
        return
      }

      const { error: placementError } = await supabase.from('space_placements').insert({
        layout_id: layout.id,
        location_id: result.data.id,
        x_cm: placement.xCm,
        y_cm: placement.yCm,
        z_cm: placement.zCm,
        width_cm: placement.widthCm,
        height_cm: placement.heightCm,
        depth_cm: placement.depthCm,
      })

      if (placementError) {
        await supabase.from('locations').delete().eq('id', result.data.id)
        setMessage(placementError.message)
        return
      }
    }

    await refresh()
    router.push('/app/space')
  }

  const isSpace = target === 'space'
  const isMapRegistration = isSpace && spaceMode === 'map'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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

      {isSpace && (
        <section>
          <SectionTitle icon={Type} title="어떤 방식으로 등록할까요?" description="좌표 없이 먼저 기록하거나, 현재 지도에 바로 배치할 수 있습니다." />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              selected={spaceMode === 'simple'}
              icon={Type}
              title="간편 등록"
              description="이름과 부모 공간만 기록합니다. 지도 배치는 나중에 할 수 있어요."
              onClick={() => {
                setSpaceMode('simple')
                setMessage(null)
              }}
            />
            <ChoiceCard
              selected={spaceMode === 'map'}
              icon={Ruler}
              title="지도 배치 등록"
              description="이름과 부모 공간에 더해 좌표·크기·형태를 입력합니다."
              onClick={() => {
                setSpaceMode('map')
                setMessage(null)
              }}
            />
          </div>
        </section>
      )}

      {!isSpace && (
        <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
          물건에는 좌표와 크기를 입력하지 않습니다. 보관 공간을 지정하면 해당 공간의 물건 목록에서 확인할 수 있습니다.
        </p>
      )}

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
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
        </div>

        {isMapRegistration && <MapFields />}
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

type SpaceParentSelectorProps = {
  spaces: Array<{ id: string; name: string; parentId: string | null; createdAt: string }>
  value: string | null
  onChange: (parentId: string | null) => void
}

function SpaceParentSelector({ spaces, value, onChange }: SpaceParentSelectorProps) {
  const [browsingParentId, setBrowsingParentId] = useState<string | null>(null)

  const spacesById = useMemo(
    () => new Map(spaces.map((space) => [space.id, space])),
    [spaces],
  )
  const browsingChildren = spaces.filter((space) => space.parentId === browsingParentId)
  const browsingPath = getSpacePath(browsingParentId, spacesById)
  const selectedPath = getSpacePath(value, spacesById)
  const recentSpaces = [...spaces]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 5)

  function enterSpace(spaceId: string) {
    setBrowsingParentId(spaceId)
  }

  return (
    <div className="sm:col-span-2">
      <input type="hidden" name="parentId" value={value ?? ''} />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">부모 공간</span>
        <span className="text-xs font-medium text-slate-400">한 단계씩 들어가 선택</span>
      </div>

      <div className="mt-1.5 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-bold text-slate-500">선택된 부모</p>
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

      <div className="mt-3 rounded-2xl bg-slate-100 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-sm font-extrabold text-slate-800">
            <FolderInput size={16} className="text-violet-700" />
            {browsingParentId ? browsingPath.at(-1)?.name : '우리 집'} 안으로 들어가기
          </div>
          {browsingParentId && (
            <button
              type="button"
              onClick={() => setBrowsingParentId(spacesById.get(browsingParentId)?.parentId ?? null)}
              className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-white hover:text-violet-700"
            >
              상위로
            </button>
          )}
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {browsingChildren.length === 0 ? (
            <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-500 sm:col-span-2">
              아직 하위 공간이 없습니다. 이 위치를 부모로 선택해 새 공간을 등록할 수 있습니다.
            </p>
          ) : (
            browsingChildren.map((space) => (
              <div key={space.id} className="flex items-center gap-1 rounded-xl bg-white p-1">
                <button
                  type="button"
                  onClick={() => enterSpace(space.id)}
                  className="min-w-0 flex-1 truncate rounded-lg px-2 py-2 text-left text-sm font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-800"
                >
                  {space.name}
                </button>
                <button
                  type="button"
                  onClick={() => onChange(space.id)}
                  className="shrink-0 rounded-lg bg-violet-100 px-2 py-2 text-xs font-extrabold text-violet-800 hover:bg-violet-200"
                >
                  부모 선택
                </button>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => onChange(browsingParentId)}
          className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-extrabold text-violet-800 hover:border-violet-400 hover:bg-violet-50"
        >
          {browsingParentId ? '현재 위치를 부모로 선택' : '우리 집 바로 아래에 등록'}
        </button>
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
                onClick={() => {
                  onChange(space.id)
                  setBrowsingParentId(space.id)
                }}
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

function MapFields() {
  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
          <Ruler size={18} />
        </span>
        <div>
          <h3 className="font-bold text-slate-900">지도 배치 정보</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            입력값은 cm 그대로 저장하고 계산합니다. 저장 시 부모 여백과 다른 공간의 겹침을 검증합니다.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="text-sm font-extrabold text-slate-800">1. 시작 위치</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">부모 공간의 왼쪽·바닥·앞쪽 모서리에서 얼마나 떨어졌는지입니다.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="좌우 X (cm)" name="x" type="number" min="0" placeholder="예: 20" />
            <Field label="높이 Y (cm)" name="y" type="number" min="0" placeholder="예: 0" />
            <Field label="앞뒤 Z (cm)" name="z" type="number" min="0" placeholder="예: 30" />
          </div>
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-800">2. 공간 크기</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">이 위치에서 차지할 실제 가로·세로·높이입니다.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="가로 X (cm)" name="width" type="number" min="1" placeholder="예: 120" />
            <Field label="높이 Y (cm)" name="height" type="number" min="1" placeholder="예: 80" />
            <Field label="세로 Z (cm)" name="depth" type="number" min="1" placeholder="예: 45" />
          </div>
        </div>
      </div>
      <div className="mt-4 max-w-xs">
        <Field label="공간 형태 (선택)" name="displayKind" placeholder="예: 옷장, 책장, 수납함" required={false} />
      </div>
    </div>
  )
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
  defaultValue?: string
  required?: boolean
}

function Field({ label, name, placeholder, type = 'text', min, defaultValue, required = true }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <input
        required={required}
        name={name}
        type={type}
        min={min}
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

function getPlacement(formData: FormData): SpacePlacement | null {
  const xCm = parseInteger(formData, 'x')
  const yCm = parseInteger(formData, 'y')
  const zCm = parseInteger(formData, 'z')
  const widthCm = parseInteger(formData, 'width')
  const heightCm = parseInteger(formData, 'height')
  const depthCm = parseInteger(formData, 'depth')

  if (
    xCm === null || yCm === null || zCm === null ||
    widthCm === null || heightCm === null || depthCm === null ||
    xCm < 0 || yCm < 0 || zCm < 0 ||
    widthCm < 1 || heightCm < 1 || depthCm < 1
  ) {
    return null
  }

  return {
    xCm,
    yCm,
    zCm,
    widthCm,
    heightCm,
    depthCm,
    displayKind: String(formData.get('displayKind')) as SpacePlacement['displayKind'],
    rotationY: 0,
  }
}

function parseInteger(formData: FormData, fieldName: string) {
  const value = Number(formData.get(fieldName))
  return Number.isInteger(value) ? value : null
}

function validatePlacement(
  placement: SpacePlacement,
  parent: { widthCm: number; heightCm: number; depthCm: number },
  existing: Array<{
    x_cm: number
    y_cm: number
    z_cm: number
    width_cm: number
    height_cm: number
    depth_cm: number
  }>,
) {
  const margin = 1
  const exceedsParent =
    placement.xCm < margin ||
    placement.yCm < margin ||
    placement.zCm < margin ||
    placement.xCm + placement.widthCm > parent.widthCm - margin ||
    placement.yCm + placement.heightCm > parent.heightCm - margin ||
    placement.zCm + placement.depthCm > parent.depthCm - margin

  if (exceedsParent) {
    return '부모 공간의 모든 면에서 1cm 이상 여백을 남겨야 합니다.'
  }

  const overlapsExisting = existing.some((other) => (
    placement.xCm < Number(other.x_cm) + Number(other.width_cm) &&
    placement.xCm + placement.widthCm > Number(other.x_cm) &&
    placement.yCm < Number(other.y_cm) + Number(other.height_cm) &&
    placement.yCm + placement.heightCm > Number(other.y_cm) &&
    placement.zCm < Number(other.z_cm) + Number(other.depth_cm) &&
    placement.zCm + placement.depthCm > Number(other.z_cm)
  ))

  return overlapsExisting ? '기존 공간과 겹칩니다. 좌표·크기를 조정해 주세요.' : null
}
