'use client'

import { Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { invalidateHomeInventory } from '@/lib/space/use-supabase-inventory'
import { createClient } from '@/lib/supabase/client'

export function DeleteItemButton({ itemId, itemName, showLabel = false }: { itemId: string; itemName: string; showLabel?: boolean }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()

  async function deleteItem() {
    if (isDeleting || !window.confirm(`“${itemName}”을 휴지통으로 옮길까요? 나중에 복원할 수 있습니다.`)) {
      return
    }

    setIsDeleting(true)
    setMessage(null)
    const { error } = await createClient()
      .from('items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) {
      setMessage(error.message)
      setIsDeleting(false)
      return
    }

    await Promise.all([
      invalidateHomeInventory(queryClient, ["items"]),
      queryClient.invalidateQueries({ queryKey: ['trash-items'] }),
    ])
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      {message && <span className="text-[10px] font-bold text-rose-700">삭제 실패</span>}
      <button
        type="button"
        onClick={() => void deleteItem()}
        disabled={isDeleting}
        className={`inline-flex items-center justify-center gap-1 rounded-lg text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50 ${showLabel ? 'px-2 py-1.5 text-xs font-semibold' : 'size-7'}`}
        aria-label={`${itemName} 삭제`}
        title="물건 삭제"
      >
        <Trash2 size={15} />
        {showLabel && (isDeleting ? '삭제 중…' : '삭제')}
      </button>
    </span>
  )
}
