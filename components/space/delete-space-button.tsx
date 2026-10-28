'use client'

import { Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { invalidateHomeInventory } from '@/lib/space/use-supabase-inventory'
import { createClient } from '@/lib/supabase/client'

type DeleteSpaceButtonProps = {
  locationId: string
  locationName: string
  childCount: number
  itemCount: number
}

export function DeleteSpaceButton({
  locationId,
  locationName,
  childCount,
  itemCount,
}: DeleteSpaceButtonProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const canDelete = childCount === 0 && itemCount === 0

  async function deleteSpace() {
    if (!canDelete || isDeleting) {
      return
    }

    const confirmed = window.confirm(
      `“${locationName}” 공간을 삭제할까요?\n공간의 3D 자리와 벽·창문 기록은 남지만, 목록과 지도에서는 숨겨집니다.`,
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    setMessage(null)

    const { error } = await createClient()
      .from('locations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', locationId)

    if (error) {
      setMessage(error.message)
      setIsDeleting(false)
      return
    }

    await invalidateHomeInventory(queryClient)
    router.push('/app/space')
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={!canDelete || isDeleting}
        onClick={() => void deleteSpace()}
        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
      >
        <Trash2 size={16} />
        {isDeleting ? '삭제하는 중...' : '이 공간 삭제'}
      </button>
      {!canDelete && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          안에 있는 공간 {childCount}개와 물건 {itemCount}개를 먼저 다른 곳으로 옮기거나 정리하면 삭제할 수 있습니다.
        </p>
      )}
      {message && <p role="alert" className="mt-2 text-xs font-bold text-rose-700">{message}</p>}
    </div>
  )
}
