'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, Trash2 } from 'lucide-react'
import type { LocalItem } from '@/lib/space/local-items'
import { invalidateHomeInventory, useSupabaseInventory } from '@/lib/space/use-supabase-inventory'
import { createClient } from '@/lib/supabase/client'

type TrashItem = LocalItem & {
  deletedAt: string
}

export function TrashItemDirectory() {
  const queryClient = useQueryClient()
  const { homeId, spaces } = useSupabaseInventory()
  const [destinationByItemId, setDestinationByItemId] = useState<Record<string, string>>({})
  const [restoringItemId, setRestoringItemId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const locations = useMemo(() => buildLocationOptions(spaces), [spaces])
  const trashQuery = useQuery({
    queryKey: ['trash-items', homeId],
    enabled: Boolean(homeId),
    queryFn: async (): Promise<TrashItem[]> => {
      const { data, error } = await createClient()
        .from('items')
        .select('id, title, location_id, quantity, unit, category, note, created_at, deleted_at')
        .eq('home_id', homeId!)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      if (error) {
        throw error
      }

      return (data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        locationId: item.location_id ?? '',
        quantity: Number(item.quantity),
        unit: item.unit ?? '',
        category: item.category,
        note: item.note,
        createdAt: item.created_at,
        deletedAt: item.deleted_at ?? item.created_at,
      }))
    },
  })
  const trashItems = trashQuery.data ?? []

  async function restoreItem(item: TrashItem) {
    const originalLocationExists = spaces.some((space) => space.id === item.locationId)
    const destinationId = originalLocationExists
      ? null
      : destinationByItemId[item.id] || null

    if (!originalLocationExists && !destinationId) {
      setMessage(`“${item.title}”을 복원할 공간을 선택해 주세요.`)
      return
    }

    setRestoringItemId(item.id)
    setMessage(null)
    const { error } = await createClient().rpc('restore_item_from_trash', {
      target_item_id: item.id,
      destination_location_id: destinationId,
    })

    setRestoringItemId(null)
    if (error) {
      setMessage(error.message)
      return
    }

    await Promise.all([
      invalidateHomeInventory(queryClient),
      queryClient.invalidateQueries({ queryKey: ['trash-items', homeId] }),
    ])
  }

  if (trashQuery.isLoading) {
    return <p className="mt-4 rounded-xl bg-white px-4 py-4 text-sm font-bold text-slate-500">휴지통을 불러오는 중입니다.</p>
  }

  if (trashQuery.error) {
    return <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-4 text-sm font-bold text-rose-700">휴지통을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
  }

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
        휴지통의 물건은 영구 삭제하지 않습니다. 원래 보관 공간이 남아 있으면 그곳으로, 사라졌다면 새 공간을 골라 복원할 수 있습니다.
      </p>
      {message && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{message}</p>}

      {trashItems.length === 0 ? (
        <div className="mt-4 grid place-items-center rounded-xl bg-slate-50 px-4 py-10 text-center">
          <Trash2 size={25} className="text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-700">휴지통이 비어 있습니다.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {trashItems.map((item) => {
            const originalLocationExists = spaces.some((space) => space.id === item.locationId)
            const isRestoring = restoringItemId === item.id

            return (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">수량: {item.quantity} · 단위: {item.unit || '없음'}{item.category ? ` · ${item.category}` : ''}</p>
                    <p className="mt-1 text-xs text-slate-500">{originalLocationExists ? '원래 보관 공간으로 복원할 수 있습니다.' : '원래 보관 공간이 없어 새 공간을 선택해야 합니다.'}</p>
                  </div>
                  {originalLocationExists ? (
                    <button type="button" onClick={() => void restoreItem(item)} disabled={isRestoring} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50">
                      <RotateCcw size={16} /> {isRestoring ? '복원 중...' : '원래 위치로 복원'}
                    </button>
                  ) : (
                    <div className="w-full sm:w-auto sm:min-w-64">
                      <select value={destinationByItemId[item.id] ?? ''} onChange={(event) => setDestinationByItemId((current) => ({ ...current, [item.id]: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-violet-500">
                        <option value="">복원할 공간 선택</option>
                        {locations.map((location) => <option key={location.id} value={location.id}>{location.label}</option>)}
                      </select>
                      <button type="button" onClick={() => void restoreItem(item)} disabled={isRestoring || !destinationByItemId[item.id]} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50">
                        <RotateCcw size={16} /> {isRestoring ? '복원 중...' : '선택한 공간으로 복원'}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
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

    return { id: space.id, label: names.join(' › ') }
  }).sort((left, right) => left.label.localeCompare(right.label, 'ko'))
}
