'use client'

import { useMemo, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { invalidateHomeInventory, useSupabaseInventory } from '@/lib/space/use-supabase-inventory'
import { createClient } from '@/lib/supabase/client'

type DeleteSpaceButtonProps = {
  locationId: string
  locationName: string
  childCount: number
  itemCount: number
}

type ItemAction = 'move' | 'trash'

export function DeleteSpaceButton({
  locationId,
  locationName,
  childCount,
  itemCount,
}: DeleteSpaceButtonProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [itemAction, setItemAction] = useState<ItemAction>('move')
  const [destinationId, setDestinationId] = useState('')
  const router = useRouter()
  const queryClient = useQueryClient()
  const { spaces } = useSupabaseInventory()
  const canDelete = childCount === 0
  const destinations = useMemo(
    () => buildDestinationOptions(spaces, locationId),
    [locationId, spaces],
  )

  function openDialog() {
    if (!canDelete || isDeleting) {
      return
    }

    setMessage(null)
    setItemAction(destinations.length > 0 ? 'move' : 'trash')
    setDestinationId('')
    setIsDialogOpen(true)
  }

  async function deleteSpace() {
    if (itemCount > 0 && itemAction === 'move' && !destinationId) {
      setMessage('물건을 옮길 공간을 선택해 주세요.')
      return
    }

    setIsDeleting(true)
    setMessage(null)
    const effectiveItemAction: ItemAction = itemCount > 0 ? itemAction : 'trash'
    const { error } = await createClient().rpc('delete_location_with_items', {
      target_location_id: locationId,
      item_action: effectiveItemAction,
      destination_location_id: effectiveItemAction === 'move' ? destinationId : null,
    })

    if (error) {
      setMessage(error.message)
      setIsDeleting(false)
      return
    }

    await Promise.all([
      invalidateHomeInventory(queryClient),
      queryClient.invalidateQueries({ queryKey: ['trash-items'] }),
    ])
    setIsDeleting(false)
    setIsDialogOpen(false)
    router.push('/app/space')
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={!canDelete || isDeleting}
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
      >
        <Trash2 size={16} />
        {isDeleting ? '삭제하는 중...' : itemCount > 0 ? '물건 정리 후 삭제' : '이 공간 삭제'}
      </button>
      {!canDelete && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          안에 있는 공간 {childCount}개를 먼저 다른 곳으로 옮기거나 정리하면 삭제할 수 있습니다.
        </p>
      )}
      {message && !isDialogOpen && <p role="alert" className="mt-2 text-xs font-bold text-rose-700">{message}</p>}

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={`${locationName} 공간 삭제`}>
          <section className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-rose-700">공간 삭제</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">“{locationName}”을 정리할까요?</h2>
              </div>
              <button type="button" onClick={() => setIsDialogOpen(false)} disabled={isDeleting} className="grid size-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100" aria-label="공간 삭제 창 닫기">
                <X size={18} />
              </button>
            </div>

            {itemCount === 0 ? (
              <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
                이 공간에는 직접 보관된 물건이 없습니다. 공간만 목록과 지도에서 숨깁니다.
              </p>
            ) : (
              <>
                <p className="mt-4 rounded-xl bg-rose-50 px-3 py-3 text-sm leading-6 text-rose-900">
                  이 공간에 있는 물건 {itemCount}개를 어떻게 처리할지 선택해 주세요. 공간 삭제와 물건 처리는 한 번에 저장됩니다.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <ActionCard
                    selected={itemAction === 'move'}
                    title="다른 공간으로 옮기기"
                    description="선택한 공간으로 물건을 모두 이동합니다."
                    onClick={() => setItemAction('move')}
                    disabled={destinations.length === 0}
                  />
                  <ActionCard
                    selected={itemAction === 'trash'}
                    title="물건을 휴지통으로"
                    description="원래 위치 정보를 남겨 두고 나중에 복원합니다."
                    onClick={() => setItemAction('trash')}
                  />
                </div>
                {itemAction === 'move' && (
                  <label className="mt-4 block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">옮길 공간</span>
                    <select value={destinationId} onChange={(event) => setDestinationId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">
                      <option value="">공간을 선택해 주세요</option>
                      {destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.label}</option>)}
                    </select>
                  </label>
                )}
              </>
            )}

            {message && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{message}</p>}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setIsDialogOpen(false)} disabled={isDeleting} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">취소</button>
              <button type="button" onClick={() => void deleteSpace()} disabled={isDeleting || (itemCount > 0 && itemAction === 'move' && !destinationId)} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300">
                {isDeleting ? '삭제하는 중...' : itemCount > 0 && itemAction === 'move' ? '이동 후 삭제' : '휴지통으로 보내고 삭제'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function ActionCard({
  selected,
  title,
  description,
  onClick,
  disabled = false,
}: {
  selected: boolean
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${selected ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-100' : 'border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50/50'}`}>
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
    </button>
  )
}

function buildDestinationOptions(
  spaces: Array<{ id: string; name: string; parentId: string | null }>,
  excludedLocationId: string,
) {
  const spacesById = new Map(spaces.map((space) => [space.id, space]))

  return spaces
    .filter((space) => space.id !== excludedLocationId)
    .map((space) => {
      const names: string[] = []
      let current: typeof space | undefined = space

      while (current) {
        names.unshift(current.name)
        current = current.parentId ? spacesById.get(current.parentId) : undefined
      }

      return { id: space.id, label: names.join(' › ') }
    })
    .sort((left, right) => left.label.localeCompare(right.label, 'ko'))
}
