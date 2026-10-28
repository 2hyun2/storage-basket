'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DeleteItemButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  async function deleteItem() {
    if (isDeleting || !window.confirm(`“${itemName}” 물건 기록을 삭제할까요?`)) {
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

    router.refresh()
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      {message && <span className="text-[10px] font-bold text-rose-700">삭제 실패</span>}
      <button
        type="button"
        onClick={() => void deleteItem()}
        disabled={isDeleting}
        className="grid size-7 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
        aria-label={`${itemName} 삭제`}
        title="물건 삭제"
      >
        <Trash2 size={15} />
      </button>
    </span>
  )
}
