'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { PanelTop, Pencil, Plus, RectangleHorizontal, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SpaceInterior3d, type SceneLayoutData, type SceneStructureData } from '@/components/space/space-interior-3d'
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
}

const emptyDraft: StructureDraft = { name: '', planX: '', planY: '', sizeX: '', sizeY: '' }

export function StructureCreateForm({ locationId, locationName }: { locationId: string; locationName: string }) {
  const [kind, setKind] = useState<StructureKind>('wall')
  const [layoutId, setLayoutId] = useState<string | null>(null)
  const [bounds, setBounds] = useState<SceneLayoutData | null>(null)
  const [structures, setStructures] = useState<StructureRecord[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<StructureDraft>(emptyDraft)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const loadScene = useCallback(async () => {
    const supabase = createClient()
    const { data: layout, error: layoutError } = await supabase
      .from('space_layouts')
      .select('id, width_cm, depth_cm, height_cm')
      .eq('scene_location_id', locationId)
      .maybeSingle()

    if (layoutError || !layout) {
      setMessage('이 공간은 아직 3D로 정해진 자리가 없습니다. 먼저 공간의 위치와 크기를 정해 주세요.')
      return
    }

    setLayoutId(layout.id)
    setBounds({ widthCm: Number(layout.width_cm), depthCm: Number(layout.depth_cm), heightCm: Number(layout.height_cm) })

    const { data: rows, error: structureError } = await supabase
      .from('scene_structures')
      .select('id, kind, name, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm')
      .eq('layout_id', layout.id)
      .order('created_at')

    if (structureError) {
      setMessage(structureError.message)
      return
    }

    setStructures((rows ?? []).map((row) => ({
      id: row.id,
      kind: row.kind as StructureKind,
      name: row.name,
      xCm: Number(row.x_cm),
      yCm: Number(row.y_cm),
      zCm: Number(row.z_cm),
      widthCm: Number(row.width_cm),
      heightCm: Number(row.height_cm),
      depthCm: Number(row.depth_cm),
    })))
  }, [locationId])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadScene() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadScene])

  function startNew(nextKind: StructureKind = kind) {
    setKind(nextKind)
    setEditingId(null)
    setDraft(emptyDraft)
    setMessage(null)
  }

  function startEdit(structure: StructureRecord) {
    setKind(structure.kind)
    setEditingId(structure.id)
    setDraft({
      name: structure.name,
      planX: structure.xCm,
      planY: structure.zCm,
      sizeX: structure.widthCm,
      sizeY: structure.depthCm,
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

    const values = [draft.planX, draft.planY, draft.sizeX, draft.sizeY]
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
    if (planX < 0 || planY < 0 || sizeX < 1 || sizeY < 1 || sizeX > bounds.widthCm || sizeY > bounds.depthCm || planX > maxX || planY > maxY) {
      setMessage(`이 공간 안에 들어오도록 정해 주세요. 현재 시작할 수 있는 최대값은 X ${Math.max(0, maxX)}cm · Y ${Math.max(0, maxY)}cm입니다.`)
      return
    }

    const name = draft.name.trim() || defaultName(kind, structures.filter((entry) => entry.kind === kind).length + 1)
    const payload = {
      layout_id: layoutId,
      kind,
      name,
      x_cm: planX,
      y_cm: 0,
      z_cm: planY,
      width_cm: sizeX,
      height_cm: kind === 'window' ? 110 : bounds.heightCm,
      depth_cm: sizeY,
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

    await loadScene()
    startNew(kind)
    router.refresh()
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

    await loadScene()
    startNew(kind)
    router.refresh()
  }

  const sizeX = numericValue(draft.sizeX)
  const sizeY = numericValue(draft.sizeY)
  const maxSizeX = bounds ? bounds.widthCm : null
  const maxSizeY = bounds ? bounds.depthCm : null
  const maxStartX = bounds ? Math.max(0, bounds.widthCm - sizeX) : null
  const maxStartY = bounds ? Math.max(0, bounds.depthCm - sizeY) : null
  const previewStructure = bounds && hasCompleteDraft(draft) ? createPreviewStructure({
    id: editingId ?? 'new-structure-preview',
    kind,
    draft,
    heightCm: bounds.heightCm,
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
    <div className="space-y-5">
      <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-3">
        <p className="text-sm font-extrabold text-violet-950">이 공간 미리 보기</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">입력값을 바꾸면 저장 전 위치와 크기가 바로 반영됩니다. 이미 만든 벽·창문은 3D에서 눌러 고칠 수 있습니다.</p>
      </div>

      <SpaceInterior3d
        spaceName={locationName}
        childSpaces={[]}
        items={[]}
        layout={bounds}
        layoutId={null}
        placements={[]}
        structures={previewStructures}
        selectedStructureId={editingId ?? previewStructure?.id ?? null}
        onStructureSelect={selectStructureFromScene}
      />

      {structures.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold">만들어 둔 벽과 창문</p>
              <p className="mt-0.5 text-xs text-slate-500">선택하면 아래 입력값을 불러와 수정할 수 있습니다.</p>
            </div>
            <button type="button" onClick={() => startNew()} className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-extrabold text-white"><Plus size={14} /> 새로 등록</button>
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

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold">{editingId ? '벽·창문 고치기' : '벽·창문 추가'}</p>
            <p className="mt-0.5 text-xs text-slate-500">평면의 X/Y를 기준으로 cm 단위로 배치합니다.</p>
          </div>
          {editingId && <button type="button" onClick={() => startNew()} className="text-xs font-bold text-violet-700">새 등록으로 전환</button>}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <KindButton kind="wall" selected={kind === 'wall'} label="벽" icon={RectangleHorizontal} onClick={startNew} />
          <KindButton kind="window" selected={kind === 'window'} label="창문" icon={PanelTop} onClick={startNew} />
        </div>

        <Field label="표시 이름" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} placeholder={kind === 'wall' ? '예: 거실 북쪽 벽' : '예: 거실 통창'} />

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-sm font-extrabold">cm 위치와 크기</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">X는 왼쪽→오른쪽, Y는 위쪽→아래쪽입니다. 창문은 벽의 자식이 아닌 별도 건축 영역이며, 문은 벽 구간을 비워 개구부로 표현합니다.</p>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <NumberField label={`좌표 X · 최대 ${maxStartX ?? '?'}cm`} value={draft.planX} min={0} max={maxStartX ?? undefined} onChange={(planX) => setDraft({ ...draft, planX })} />
              <NumberField label={`좌표 Y · 최대 ${maxStartY ?? '?'}cm`} value={draft.planY} min={0} max={maxStartY ?? undefined} onChange={(planY) => setDraft({ ...draft, planY })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label={`가로 X · 최대 ${maxSizeX ?? '?'}cm`} value={draft.sizeX} min={1} max={maxSizeX ?? undefined} onChange={(sizeX) => setDraft({ ...draft, sizeX })} />
              <NumberField label={`세로 Y · 최대 ${maxSizeY ?? '?'}cm`} value={draft.sizeY} min={1} max={maxSizeY ?? undefined} onChange={(sizeY) => setDraft({ ...draft, sizeY })} />
            </div>
          </div>
        </div>

        {message && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{message}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {editingId && (
            <button
              type="button"
              onClick={() => void deleteStructure()}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50"
            >
              <Trash2 size={16} />
              삭제
            </button>
          )}
          <button className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-extrabold text-white disabled:bg-violet-300" disabled={!layoutId}>
            {editingId ? `${kind === 'wall' ? '벽' : '창문'} 수정 저장` : `${kind === 'wall' ? '벽' : '창문'} 저장`}
          </button>
        </div>
      </form>
    </div>
  )
}

function KindButton({ kind, selected, label, icon: Icon, onClick }: { kind: StructureKind; selected: boolean; label: string; icon: typeof PanelTop; onClick: (kind: StructureKind) => void }) {
  return <button type="button" onClick={() => onClick(kind)} className={`rounded-2xl border p-3 text-left ${selected ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-600'}`}><Icon size={18} /><span className="mt-2 block text-sm font-extrabold">{label}</span></button>
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: NumericInput; min: number; max?: number; onChange: (value: NumericInput) => void }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span><input type="number" value={value} min={min} max={max} onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
}

function defaultName(kind: StructureKind, number: number) {
  return `${kind === 'wall' ? '벽' : '창문'} ${number}`
}

function createPreviewStructure({
  id,
  kind,
  draft,
  heightCm,
  existingCount,
}: {
  id: string
  kind: StructureKind
  draft: StructureDraft
  heightCm: number
  existingCount: number
}): StructureRecord {
  return {
    id,
    kind,
    name: draft.name.trim() || `${defaultName(kind, existingCount + 1)} 미리보기`,
    xCm: numericValue(draft.planX),
    yCm: 0,
    zCm: numericValue(draft.planY),
    widthCm: numericValue(draft.sizeX),
    heightCm: kind === 'window' ? Math.min(110, heightCm) : heightCm,
    depthCm: numericValue(draft.sizeY),
  }
}

function numericValue(value: NumericInput) {
  return value === '' ? 0 : value
}

function hasCompleteDraft(draft: StructureDraft) {
  return [draft.planX, draft.planY, draft.sizeX, draft.sizeY].every((value) => value !== '')
}
