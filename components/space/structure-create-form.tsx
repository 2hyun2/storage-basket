'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { DoorOpen, PanelTop, RectangleHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type StructureKind = 'wall' | 'door' | 'window'

type WallOption = {
  id: string
  name: string
}

export function StructureCreateForm({ locationId }: { locationId: string }) {
  const [kind, setKind] = useState<StructureKind>('wall')
  const [walls, setWalls] = useState<WallOption[]>([])
  const [layoutId, setLayoutId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadScene() {
      const supabase = createClient()
      const { data: layout } = await supabase
        .from('space_layouts')
        .select('id')
        .eq('scene_location_id', locationId)
        .maybeSingle()

      if (!layout) {
        setMessage('이 공간에는 아직 3D 장면이 없습니다. 먼저 공간 배치값을 등록해 주세요.')
        return
      }

      setLayoutId(layout.id)
      const { data: wallRows } = await supabase
        .from('scene_structures')
        .select('id, name')
        .eq('layout_id', layout.id)
        .eq('kind', 'wall')
        .order('created_at')
      setWalls(wallRows ?? [])
    }

    void loadScene()
  }, [locationId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!layoutId) {
      setMessage('3D 장면을 불러오지 못했습니다.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim() || defaultName(kind, walls.length + 1)
    const parentWallId = String(formData.get('parentWallId') ?? '') || null
    const values = ['x', 'y', 'z', 'width', 'height', 'depth'].map((field) => Number(formData.get(field)))

    if (values.some((value) => !Number.isInteger(value) || value < 0) || values.slice(3).some((value) => value < 1)) {
      setMessage('좌표와 크기는 0 이상의 정수 cm이며, 크기는 1cm 이상이어야 합니다.')
      return
    }

    if (kind !== 'wall' && !parentWallId) {
      setMessage('문·창문은 연결할 벽을 선택해야 합니다.')
      return
    }

    const [xCm, yCm, zCm, widthCm, heightCm, depthCm] = values
    const { error } = await createClient().from('scene_structures').insert({
      layout_id: layoutId,
      kind,
      name,
      parent_wall_id: parentWallId,
      x_cm: xCm,
      y_cm: yCm,
      z_cm: zCm,
      width_cm: widthCm,
      height_cm: heightCm,
      depth_cm: depthCm,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    router.push(`/app/space/${locationId}`)
    router.refresh()
  }

  const requiresWall = kind !== 'wall'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <KindButton kind="wall" selected={kind === 'wall'} label="벽" icon={RectangleHorizontal} onClick={setKind} />
        <KindButton kind="door" selected={kind === 'door'} label="문" icon={DoorOpen} onClick={setKind} />
        <KindButton kind="window" selected={kind === 'window'} label="창문" icon={PanelTop} onClick={setKind} />
      </div>

      <Field label="표시 이름" name="name" placeholder={kind === 'wall' ? '예: 안방 북쪽 벽' : kind === 'door' ? '예: 안방 출입문' : '예: 침대 옆 창문'} required={false} />

      {requiresWall && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">연결할 벽</span>
          <select name="parentWallId" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
            <option value="">벽을 선택하세요</option>
            {walls.map((wall) => <option key={wall.id} value={wall.id}>{wall.name}</option>)}
          </select>
        </label>
      )}

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-extrabold">cm 배치값</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">문·창문은 연결한 벽의 시작점 기준 상대 위치를 입력합니다.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="X" name="x" type="number" min="0" defaultValue="0" />
          <Field label="Y" name="y" type="number" min="0" defaultValue="0" />
          <Field label="Z" name="z" type="number" min="0" defaultValue="0" />
          <Field label="너비" name="width" type="number" min="1" defaultValue="90" />
          <Field label="높이" name="height" type="number" min="1" defaultValue={kind === 'window' ? '110' : '210'} />
          <Field label="두께" name="depth" type="number" min="1" defaultValue="10" />
        </div>
      </div>

      {message && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{message}</p>}
      <button className="w-full rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-extrabold text-white disabled:bg-violet-300" disabled={!layoutId}>
        {kind === 'wall' ? '벽 저장' : kind === 'door' ? '문 저장' : '창문 저장'}
      </button>
    </form>
  )
}

function KindButton({ kind, selected, label, icon: Icon, onClick }: { kind: StructureKind; selected: boolean; label: string; icon: typeof DoorOpen; onClick: (kind: StructureKind) => void }) {
  return <button type="button" onClick={() => onClick(kind)} className={`rounded-2xl border p-3 text-left ${selected ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-600'}`}><Icon size={18} /><span className="mt-2 block text-sm font-extrabold">{label}</span></button>
}

function Field({ label, name, type = 'text', min, defaultValue, placeholder, required = true }: { label: string; name: string; type?: 'text' | 'number'; min?: string; defaultValue?: string; placeholder?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span><input name={name} type={type} min={min} defaultValue={defaultValue} placeholder={placeholder} required={required} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
}

function defaultName(kind: StructureKind, number: number) {
  return `${kind === 'wall' ? '벽' : kind === 'door' ? '문' : '창문'} ${number}`
}
