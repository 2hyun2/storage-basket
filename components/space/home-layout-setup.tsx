'use client'

import { useState, type FormEvent } from 'react'
import { House, Ruler } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'

export function HomeLayoutSetup() {
  const { homeId, homeLayout, refresh, isLoading } = useSupabaseInventory()
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading || homeLayout) return null

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
  }

  return (
    <section className="mt-6 rounded-3xl border border-violet-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><House size={20} /></span>
        <div>
          <p className="text-sm font-bold text-violet-700">첫 공간 설계</p>
          <h2 className="mt-1 text-xl font-extrabold">우리 집 전체 크기부터 정해 주세요</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">이 값이 모든 방과 구조물이 들어갈 최상위 cm 격자의 크기가 됩니다.</p>
        </div>
      </div>
      <form onSubmit={saveHomeLayout} className="mt-5 grid gap-3 sm:grid-cols-3">
        <NumberField label="가로 X (cm)" name="widthCm" placeholder="예: 900" />
        <NumberField label="세로 Z (cm)" name="depthCm" placeholder="예: 600" />
        <NumberField label="천장 높이 Y (cm)" name="heightCm" placeholder="예: 240" />
        <button disabled={isSaving} className="sm:col-span-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-extrabold text-white disabled:bg-violet-300"><Ruler size={16} />{isSaving ? '격자 생성 중...' : '빈 집 격자 만들기'}</button>
      </form>
      {message && <p className="mt-3 text-sm font-bold text-rose-700">{message}</p>}
    </section>
  )
}

function NumberField({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  return <label><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span><input required name={name} type="number" min="3" step="1" placeholder={placeholder} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
}
