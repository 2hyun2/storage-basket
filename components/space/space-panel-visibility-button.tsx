'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { invalidateHomeInventory } from '@/lib/space/use-supabase-inventory'
import { createClient } from '@/lib/supabase/client'

export function SpacePanelVisibilityButton({
  locationId,
  initialVisibility,
}: {
  locationId: string
  initialVisibility: boolean
}) {
  const [isVisible, setIsVisible] = useState(initialVisibility)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()

  async function togglePanel() {
    if (isSaving) {
      return
    }

    const nextVisibility = !isVisible
    setIsSaving(true)
    setMessage(null)
    const { error } = await createClient()
      .from('locations')
      .update({ is_panel_visible: nextVisibility })
      .eq('id', locationId)

    if (error) {
      setMessage(error.message)
      setIsSaving(false)
      return
    }

    setIsVisible(nextVisibility)
    setIsSaving(false)
    await invalidateHomeInventory(queryClient)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void togglePanel()}
        disabled={isSaving}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        {isVisible ? '상위 화면에서 이름표 숨기기' : '상위 화면에서 이름표 보이기'}
      </button>
      {message && <p role="alert" className="mt-2 text-xs font-bold text-rose-700">{message}</p>}
    </div>
  )
}
