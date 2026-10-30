'use client'

import { useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { invalidateHomeInventory } from '@/lib/space/use-supabase-inventory'

export function SpaceNameEditor({
  locationId,
  initialName,
}: {
  locationId: string
  initialName: string
}) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function saveName() {
    const nextName = name.trim()
    if (!nextName) {
      setMessage('공간 이름을 입력해 주세요.')
      return
    }

    setIsSaving(true)
    setMessage(null)
    const { error } = await createClient()
      .from('locations')
      .update({ name: nextName })
      .eq('id', locationId)
    setIsSaving(false)

    if (error) {
      setMessage(error.code === '23505'
        ? '같은 위치 안에 같은 이름의 공간이 이미 있습니다.'
        : error.message)
      return
    }

    await invalidateHomeInventory(queryClient, ["locations"])
    setIsEditing(false)
  }

  function closeEditor() {
    setName(initialName)
    setMessage(null)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
      >
        <Pencil size={16} />
        공간 이름 수정
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="공간 이름 수정">
      <section className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-violet-700">공간 정보</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">공간 이름 수정</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">이름을 바꿔도 공간의 3D 자리, 안에 있는 물건, 하위 공간은 그대로 유지됩니다.</p>
          </div>
          <button type="button" onClick={closeEditor} disabled={isSaving} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100" aria-label="공간 이름 수정 창 닫기">
            <X size={18} />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">공간 이름</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            autoFocus
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
          />
        </label>

        {message && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{message}</p>}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={closeEditor} disabled={isSaving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">취소</button>
          <button type="button" onClick={() => void saveName()} disabled={isSaving} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300">
            <Check size={16} />
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </section>
    </div>
  )
}
