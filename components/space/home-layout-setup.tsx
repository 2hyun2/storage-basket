'use client'

import { useState, type FormEvent } from 'react'
import { House, Ruler } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'

export function HomeLayoutSetup() {
  const { homeId, homeLayout, placements, refresh, isLoading } = useSupabaseInventory()
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading) return null

  async function saveHomeLayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!homeId) return

    const formData = new FormData(event.currentTarget)
    const widthCm = Number(formData.get('widthCm'))
    const depthCm = Number(formData.get('depthCm'))
    const heightCm = Number(formData.get('heightCm'))

    if ([widthCm, depthCm, heightCm].some((value) => !Number.isInteger(value) || value < 3)) {
      setMessage('가로·세로·높이는 모두 3cm 이상의 정수로 입력해 주세요.')
      return
    }

    const outOfBoundsPlacement = placements.find((placement) => (
      placement.xCm + placement.widthCm > widthCm ||
      placement.zCm + placement.depthCm > depthCm ||
      placement.yCm + placement.heightCm > heightCm
    ))
    if (outOfBoundsPlacement) {
      setMessage('이미 배치된 최상위 공간이 새 집 크기를 벗어납니다. 먼저 해당 공간의 3D 자리나 크기를 조정해 주세요.')
      return
    }

    setIsSaving(true)
    const { error } = await createClient().from('space_layouts').upsert(
      {
        home_id: homeId,
        scene_location_id: null,
        layout_key: 'home',
        view_kind: 'plan',
        width_cm: widthCm,
        height_cm: heightCm,
        depth_cm: depthCm,
      },
      { onConflict: 'home_id,layout_key' },
    )

    if (error) {
      setMessage(error.message)
      setIsSaving(false)
      return
    }

    await refresh()
    setIsSaving(false)
    setIsEditing(false)
  }

  if (homeLayout && !isEditing) {
    return (
      <section className="mt-6 flex flex-col justify-between gap-3 border border-violet-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><House size={20} /></span>
          <div>
            <p className="text-sm font-bold text-violet-700">우리 집 전체 크기</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">가로 {homeLayout.widthCm}cm · 세로 {homeLayout.depthCm}cm · 공간 높이 {homeLayout.heightCm}cm</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-extrabold text-violet-700 transition hover:bg-violet-50"
        >
          <Ruler size={16} />
          집 크기 수정
        </button>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-3xl border border-violet-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><House size={20} /></span>
        <div>
          <p className="text-sm font-bold text-violet-700">{homeLayout ? '우리 집 크기 수정' : '첫 공간 설계'}</p>
          <h2 className="mt-1 text-xl font-extrabold">{homeLayout ? '우리 집 전체 크기를 고쳐 주세요' : '우리 집 전체 크기부터 정해 주세요'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">이 값이 모든 방과 집 구조를 그릴 가장 바깥쪽 크기가 됩니다. 이미 배치된 공간이 새 범위를 벗어나면 저장할 수 없습니다.</p>
        </div>
      </div>
      <form onSubmit={saveHomeLayout} className="mt-5 grid gap-3 sm:grid-cols-3">
        <NumberField label="가로 X (cm)" name="widthCm" placeholder="예: 900" defaultValue={homeLayout?.widthCm} />
        <NumberField label="세로 Y (cm)" name="depthCm" placeholder="예: 600" defaultValue={homeLayout?.depthCm} />
        <NumberField label="공간 높이 Z (cm)" name="heightCm" placeholder="예: 240" defaultValue={homeLayout?.heightCm} />
        <div className="flex gap-2 sm:col-span-3">
          {homeLayout && <button type="button" onClick={() => { setIsEditing(false); setMessage(null) }} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600">취소</button>}
          <button disabled={isSaving} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-extrabold text-white disabled:bg-violet-300"><Ruler size={16} />{isSaving ? '저장 중...' : homeLayout ? '집 크기 저장' : '빈 집 격자 만들기'}</button>
        </div>
      </form>
      {message && <p className="mt-3 text-sm font-bold text-rose-700">{message}</p>}
    </section>
  )
}

function NumberField({ label, name, placeholder, defaultValue }: { label: string; name: string; placeholder: string; defaultValue?: number }) {
  return <label><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span><input required name={name} type="number" min="3" step="1" placeholder={placeholder} defaultValue={defaultValue} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
}
