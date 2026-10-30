'use client'

import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PanelTop, Pencil, Plus, RectangleHorizontal, Trash2 } from 'lucide-react'
import {
  PlanPlacementCanvas,
  PlacementHeightPreview,
  rectanglesOverlap,
  SpaceInterior3d,
  type SceneLayoutData,
  type SceneSiblingPlacement,
  type SceneStructureData,
} from '@/components/space/space-interior-3d'
import { normalizeSpaceColor } from '@/lib/space/colors'
import { invalidateHomeInventory, useSupabaseInventory } from '@/lib/space/use-supabase-inventory'
import { createClient } from '@/lib/supabase/client'

type StructureKind = 'wall' | 'window'
type StructureRecord = SceneStructureData
type NumericInput = number | ''
type StructureDraft = {
  name: string
  planX: NumericInput
  planY: NumericInput
  sizeX: NumericInput
  sizeY: NumericInput
  elevation: NumericInput
  height: NumericInput
}

const emptyDraft: StructureDraft = { name: '', planX: '', planY: '', sizeX: '', sizeY: '', elevation: 0, height: '' }
const defaultStructureHeightCm = 100

function getDefaultStructureColor(kind: StructureKind) {
  return kind === 'window' ? '#38BDF8' : '#C4B5FD'
}

export function StructureCreateForm({
  locationId,
  locationName,
  initialEditId,
}: {
  locationId: string
  locationName: string
  initialEditId?: string
}) {
  const queryClient = useQueryClient()
  const {
    spaces,
    layouts,
    placements: cachedPlacements,
    structures: cachedStructures,
  } = useSupabaseInventory()
  const layout = layouts.find((entry) => entry.sceneLocationId === locationId) ?? null
  const layoutId = layout?.id ?? null
  const bounds: SceneLayoutData | null = layout
    ? { widthCm: layout.widthCm, depthCm: layout.depthCm, heightCm: layout.heightCm }
    : null
  // 새 구조물은 최대 100cm로 시작하고 기존 구조물은 저장된 높이를 유지한다.
  const defaultHeightCm = bounds
    ? Math.min(defaultStructureHeightCm, bounds.heightCm)
    : defaultStructureHeightCm
  const structures: StructureRecord[] = layout
    ? cachedStructures.filter((structure) => structure.layoutId === layout.id)
    : []
  const childSpaces = spaces.filter((space) => space.parentId === locationId)
  const placements = layout
    ? cachedPlacements.filter((placement) => placement.layoutId === layout.id)
    : []
  const initialStructure = initialEditId
    ? structures.find((structure) => structure.id === initialEditId) ?? null
    : null
  const [kind, setKind] = useState<StructureKind>(initialStructure?.kind ?? 'wall')
  const [editingId, setEditingId] = useState<string | null>(initialStructure?.id ?? null)
  const [structureColor, setStructureColor] = useState(
    initialStructure?.colorHex ?? getDefaultStructureColor(initialStructure?.kind ?? 'wall'),
  )
  const [isLabelVisible, setIsLabelVisible] = useState(
    initialStructure?.isLabelVisible !== false,
  )
  const [draft, setDraft] = useState<StructureDraft>(() => initialStructure ? {
    name: initialStructure.name,
    planX: initialStructure.xCm,
    planY: initialStructure.zCm,
    sizeX: initialStructure.widthCm,
    sizeY: initialStructure.depthCm,
    elevation: initialStructure.yCm,
    height: initialStructure.heightCm,
  } : { ...emptyDraft, height: defaultHeightCm })
  const structureHeightCm = draft.height === '' ? defaultHeightCm : draft.height
  const elevationCm = numericValue(draft.elevation)
  const [message, setMessage] = useState<string | null>(null)
  const siblingPlacements: SceneSiblingPlacement[] = [
    ...childSpaces.flatMap((space) => {
      const placement = placements.find((entry) => entry.locationId === space.id)
      return placement
        ? [{ ...placement, name: space.name, kind: 'space' as const }]
        : []
    }),
    ...structures
      .filter((structure) => structure.id !== editingId)
      .map((structure) => ({
        ...structure,
        locationId: structure.id,
        name: `${structure.kind === 'window' ? '창문' : '벽'} · ${structure.name}`,
      })),
  ]

  function startNew(nextKind: StructureKind = kind) {
    setKind(nextKind)
    setEditingId(null)
    setStructureColor(getDefaultStructureColor(nextKind))
    setIsLabelVisible(true)
    setDraft({ ...emptyDraft, height: defaultHeightCm })
    setMessage(null)
  }

  function startEdit(structure: StructureRecord) {
    setKind(structure.kind)
    setEditingId(structure.id)
    setStructureColor(structure.colorHex ?? getDefaultStructureColor(structure.kind))
    setIsLabelVisible(structure.isLabelVisible !== false)
    setDraft({
      name: structure.name,
      planX: structure.xCm,
      planY: structure.zCm,
      sizeX: structure.widthCm,
      sizeY: structure.depthCm,
      elevation: structure.yCm,
      height: structure.heightCm,
    })
    setMessage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    if (!layoutId || !bounds) {
      setMessage('현재 공간의 3D 화면을 불러오지 못했습니다.')
      return
    }

    const values = [draft.planX, draft.planY, draft.sizeX, draft.sizeY, draft.elevation, draft.height]
    if (values.some((value) => value === '' || !Number.isInteger(value))) {
      setMessage('좌표와 크기는 정수 cm로 입력해 주세요. 크기는 1cm 이상이어야 합니다.')
      return
    }

    const planX = numericValue(draft.planX)
    const planY = numericValue(draft.planY)
    const sizeX = numericValue(draft.sizeX)
    const sizeY = numericValue(draft.sizeY)
    const maxX = bounds.widthCm - sizeX
    const maxY = bounds.depthCm - sizeY
    if (elevationCm < 0 || structureHeightCm < 1 || elevationCm + structureHeightCm > bounds.heightCm) {
      setMessage('바닥에서의 높이와 공간 자체의 높이의 합이 담고 있는 공간의 높이를 넘을 수 없습니다.')
      return
    }
    if (planX < 0 || planY < 0 || sizeX < 1 || sizeY < 1 || sizeX > bounds.widthCm || sizeY > bounds.depthCm || planX > maxX || planY > maxY) {
      setMessage(`이 공간 안에 들어오도록 정해 주세요. 현재 시작할 수 있는 최대값은 X ${Math.max(0, maxX)}cm · Y ${Math.max(0, maxY)}cm입니다.`)
      return
    }

    const overlappingSibling = siblingPlacements.find((sibling) => rectanglesOverlap(
      { x: planX, y: planY, width: sizeX, height: sizeY },
      { x: sibling.xCm, y: sibling.zCm, width: sibling.widthCm, height: sibling.depthCm },
    ))
    if (overlappingSibling) {
      setMessage(`“${overlappingSibling.name}”과 겹칩니다. 비어 있는 자리로 옮겨 주세요.`)
      return
    }

    const name = draft.name.trim() || defaultName(kind, structures.filter((entry) => entry.kind === kind).length + 1)
    const colorHex = normalizeSpaceColor(structureColor)
    if (!colorHex) {
      setMessage('색상은 #RRGGBB 형식으로 입력해 주세요.')
      return
    }

    const payload = {
      layout_id: layoutId,
      kind,
      name,
      x_cm: planX,
      y_cm: elevationCm,
      z_cm: planY,
      width_cm: sizeX,
      height_cm: structureHeightCm,
      depth_cm: sizeY,
      color_hex: colorHex,
      is_label_visible: isLabelVisible,
    }
    const supabase = createClient()
    const query = editingId
      ? supabase.from('scene_structures').update(payload).eq('id', editingId)
      : supabase.from('scene_structures').insert(payload)
    const { error } = await query
    if (error) {
      setMessage(error.message)
      return
    }

    startNew(kind)
    await invalidateHomeInventory(queryClient)
  }

  async function deleteStructure() {
    if (!editingId || !window.confirm(`“${draft.name || '이 구조물'}”을 삭제할까요?`)) {
      return
    }

    setMessage(null)
    const { error } = await createClient()
      .from('scene_structures')
      .delete()
      .eq('id', editingId)

    if (error) {
      setMessage(error.message)
      return
    }

    startNew(kind)
    await invalidateHomeInventory(queryClient)
  }

  const sizeX = numericValue(draft.sizeX)
  const sizeY = numericValue(draft.sizeY)
  const maxSizeX = bounds ? bounds.widthCm : null
  const maxSizeY = bounds ? bounds.depthCm : null
  const maxStartX = bounds ? Math.max(0, bounds.widthCm - sizeX) : null
  const maxStartY = bounds ? Math.max(0, bounds.depthCm - sizeY) : null
  const isDraftComplete = hasCompleteDraft(draft)
  const overlappingSibling = isDraftComplete
    ? siblingPlacements.find((sibling) => rectanglesOverlap(
        {
          x: numericValue(draft.planX),
          y: numericValue(draft.planY),
          width: sizeX,
          height: sizeY,
        },
        {
          x: sibling.xCm,
          y: sibling.zCm,
          width: sibling.widthCm,
          height: sibling.depthCm,
        },
      )) ?? null
    : null
  const previewStructure = bounds && isDraftComplete ? createPreviewStructure({
    id: editingId ?? 'new-structure-preview',
    kind,
    draft,
    heightCm: structureHeightCm,
    colorHex: normalizeSpaceColor(structureColor) ?? getDefaultStructureColor(kind),
    isLabelVisible,
    existingCount: structures.filter((structure) => structure.kind === kind).length,
  }) : null
  const previewStructures = previewStructure
    ? editingId
      ? structures.map((structure) => structure.id === editingId ? previewStructure : structure)
      : [...structures, previewStructure]
    : structures

  function selectStructureFromScene(structure: StructureRecord) {
    if (structures.some((savedStructure) => savedStructure.id === structure.id)) {
      startEdit(structure)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
        <p className="text-sm font-semibold text-violet-950">이 공간 미리 보기</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">입력값을 바꾸면 저장 전 위치와 크기가 바로 반영됩니다. 이 안의 공간·벽·창문을 함께 보여 주므로 서로 겹치지 않게 확인할 수 있습니다.</p>
      </div>

      <SpaceInterior3d
        spaceName={locationName}
        childSpaces={childSpaces.map((space) => ({
          id: space.id,
          name: space.name,
          is_panel_visible: space.isPanelVisible,
          colorHex: space.colorHex,
        }))}
        items={[]}
        layout={bounds}
        layoutId={null}
        placements={placements}
        structures={previewStructures}
        selectedStructureId={editingId ?? previewStructure?.id ?? null}
        onStructureSelect={selectStructureFromScene}
      />

      {structures.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">만들어 둔 벽과 창문</p>
              <p className="mt-0.5 text-xs text-slate-500">선택하면 아래 입력값을 불러와 수정할 수 있습니다.</p>
            </div>
            <button type="button" onClick={() => startNew()} className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white"><Plus size={14} /> 새로 등록</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {structures.map((structure) => (
              <button key={structure.id} type="button" onClick={() => startEdit(structure)} className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold ${editingId === structure.id ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                <Pencil size={13} /> {structure.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{editingId ? '벽·창문 고치기' : '벽·창문 추가'}</p>
            <p className="mt-0.5 text-xs text-slate-500">평면의 X/Y를 기준으로 cm 단위로 배치합니다.</p>
          </div>
          {editingId && <button type="button" onClick={() => startNew()} className="text-xs font-bold text-violet-700">새 등록으로 전환</button>}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <KindButton kind="wall" selected={kind === 'wall'} label="벽" icon={RectangleHorizontal} onClick={startNew} />
          <KindButton kind="window" selected={kind === 'window'} label="창문" icon={PanelTop} onClick={startNew} />
        </div>

        <Field label="표시 이름" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} placeholder={kind === 'wall' ? '예: 거실 북쪽 벽' : '예: 거실 통창'} />
        <StructureColorField value={structureColor} onChange={setStructureColor} />
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={isLabelVisible}
            onChange={(event) => setIsLabelVisible(event.target.checked)}
          />
          3D에서 이름표 보이기
        </label>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-semibold">cm 위치와 크기</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">X는 왼쪽→오른쪽, Y는 위쪽→아래쪽입니다. 창문은 벽의 자식이 아닌 별도 건축 영역이며, 문은 벽 구간을 비워 개구부로 표현합니다.</p>
          {bounds && (
            <PlacementHeightPreview
              bounds={bounds}
              siblings={siblingPlacements}
              draft={{
                x: numericValue(draft.planX),
                y: numericValue(draft.planY),
                z: elevationCm,
                width: sizeX,
                depth: sizeY,
                height: structureHeightCm,
              }}
              color={normalizeSpaceColor(structureColor) ?? getDefaultStructureColor(kind)}
            />
          )}
          <p className="mt-3 text-xs font-semibold text-slate-700">바닥 위치 정하기 · 아래 격자를 드래그하세요</p>
          <PlanPlacementCanvas
            draft={{
              x: numericValue(draft.planX),
              y: numericValue(draft.planY),
              width: sizeX,
              depth: sizeY,
            }}
            bounds={bounds}
            siblings={siblingPlacements}
            isOverlapping={Boolean(overlappingSibling)}
            onChange={(next) => setDraft({
              ...draft,
              planX: next.x,
              planY: next.y,
              sizeX: next.width,
              sizeY: next.depth,
            })}
          />
          <p className="mt-3 text-xs font-bold text-slate-600">회색은 기존 공간, 보라·파랑은 벽·창문입니다. 드래그는 10cm 격자에 맞춰지며, 아래에서 1cm 단위로 고칠 수 있습니다.</p>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <p className="col-span-2 text-xs font-semibold text-slate-700">시작 위치 · X는 왼쪽→오른쪽, Y는 위쪽→아래쪽</p>
              <NumberField label={`좌표 X · 최대 ${maxStartX ?? '?'}cm`} value={draft.planX} min={0} max={maxStartX ?? undefined} onChange={(planX) => setDraft({ ...draft, planX })} />
              <NumberField label={`좌표 Y · 최대 ${maxStartY ?? '?'}cm`} value={draft.planY} min={0} max={maxStartY ?? undefined} onChange={(planY) => setDraft({ ...draft, planY })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="col-span-2 text-xs font-semibold text-slate-700">구조물 크기 · 가로는 X, 세로는 Y</p>
              <NumberField label={`가로 X · 최대 ${maxSizeX ?? '?'}cm`} value={draft.sizeX} min={1} max={maxSizeX ?? undefined} onChange={(sizeX) => setDraft({ ...draft, sizeX })} />
              <NumberField label={`세로 Y · 최대 ${maxSizeY ?? '?'}cm`} value={draft.sizeY} min={1} max={maxSizeY ?? undefined} onChange={(sizeY) => setDraft({ ...draft, sizeY })} />
            </div>
          </div>
          {overlappingSibling && (
            <p className="mt-3 text-xs font-bold text-rose-700">
              현재 위치는 “{overlappingSibling.name}”과 겹칩니다.
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <NumberField label={`바닥에서의 높이 · 최대 ${bounds ? Math.max(0, bounds.heightCm - structureHeightCm) : '?'}cm`} value={draft.elevation} min={0} max={bounds ? Math.max(0, bounds.heightCm - structureHeightCm) : undefined} onChange={(elevation) => setDraft({ ...draft, elevation })} />
            <NumberField label={`공간 자체의 높이 · 최대 ${bounds ? Math.max(0, bounds.heightCm - elevationCm) : '?'}cm`} value={draft.height} min={1} max={bounds ? Math.max(0, bounds.heightCm - elevationCm) : undefined} onChange={(height) => setDraft({ ...draft, height })} />
          </div>
        </div>

        {message && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{message}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {editingId && (
            <button
              type="button"
              onClick={() => void deleteStructure()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              <Trash2 size={16} />
              삭제
            </button>
          )}
          <button className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-violet-300" disabled={!layoutId}>
            {editingId ? `${kind === 'wall' ? '벽' : '창문'} 수정 저장` : `${kind === 'wall' ? '벽' : '창문'} 저장`}
          </button>
        </div>
      </form>
    </div>
  )
}

function KindButton({ kind, selected, label, icon: Icon, onClick }: { kind: StructureKind; selected: boolean; label: string; icon: typeof PanelTop; onClick: (kind: StructureKind) => void }) {
  return <button type="button" onClick={() => onClick(kind)} className={`rounded-xl border p-3 text-left ${selected ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-600'}`}><Icon size={18} /><span className="mt-2 block text-sm font-semibold">{label}</span></button>
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: NumericInput; min: number; max?: number; onChange: (value: NumericInput) => void }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span><input type="number" value={value} min={min} max={max} onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
}

function StructureColorField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">표시 색상</span>
      <span className="mb-2 block text-xs leading-5 text-slate-500">
        3D 미리보기와 저장된 구조물에 같은 색상으로 표시됩니다.
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={normalizeSpaceColor(value) ?? '#C4B5FD'}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
          aria-label="구조물 색상 선택"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          placeholder="#C4B5FD"
          maxLength={7}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase"
        />
      </div>
    </label>
  )
}

function defaultName(kind: StructureKind, number: number) {
  return `${kind === 'wall' ? '벽' : '창문'} ${number}`
}

function createPreviewStructure({
  id,
  kind,
  draft,
  heightCm,
  colorHex,
  isLabelVisible,
  existingCount,
}: {
  id: string
  kind: StructureKind
  draft: StructureDraft
  heightCm: number
  colorHex: string
  isLabelVisible: boolean
  existingCount: number
}): StructureRecord {
  return {
    id,
    kind,
    name: draft.name.trim() || `${defaultName(kind, existingCount + 1)} 미리보기`,
    xCm: numericValue(draft.planX),
    yCm: numericValue(draft.elevation),
    zCm: numericValue(draft.planY),
    widthCm: numericValue(draft.sizeX),
    heightCm,
    depthCm: numericValue(draft.sizeY),
    colorHex,
    isLabelVisible,
  }
}

function numericValue(value: NumericInput) {
  return value === '' ? 0 : value
}

function hasCompleteDraft(draft: StructureDraft) {
  return [draft.planX, draft.planY, draft.sizeX, draft.sizeY].every((value) => value !== '')
}
