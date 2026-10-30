'use client'

import { useState } from 'react'
import { Palette } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { getDefaultSpaceColor, normalizeSpaceColor } from '@/lib/space/colors'
import { invalidateHomeInventory } from '@/lib/space/use-supabase-inventory'
import { createClient } from '@/lib/supabase/client'

export function SpaceColorPicker({ locationId, initialColor }: { locationId: string; initialColor?: string }) {
  const queryClient = useQueryClient()
  const [color, setColor] = useState(initialColor ?? getDefaultSpaceColor())
  const [message, setMessage] = useState<string | null>(null)

  async function saveColor() {
    const colorHex = normalizeSpaceColor(color)
    if (!colorHex) {
      setMessage('HEX 색상값은 #RRGGBB 형식이어야 합니다.')
      return
    }

    const { error } = await createClient()
      .from('locations')
      .update({ color_hex: colorHex })
      .eq('id', locationId)

    if (error) {
      setMessage(error.message)
      return
    }

    await invalidateHomeInventory(queryClient, ["locations"])
    setColor(colorHex)
    setMessage('색상을 저장했습니다.')
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <Palette size={16} className="text-violet-700" />
      <span className="text-xs font-semibold text-slate-700">공간 색상</span>
      <span
        aria-label="선택한 색상 미리보기"
        className="size-6 rounded-md border border-slate-300 shadow-sm"
        style={{ backgroundColor: normalizeSpaceColor(color) ?? getDefaultSpaceColor() }}
      />
      <input
        type="color"
        value={normalizeSpaceColor(color) ?? getDefaultSpaceColor()}
        onChange={(event) => setColor(event.target.value.toUpperCase())}
        aria-label="공간 색상 선택"
        className="size-7 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
      />
      <input
        value={color}
        onChange={(event) => setColor(event.target.value.toUpperCase())}
        maxLength={7}
        aria-label="HEX 색상값"
        className="w-24 rounded-lg border border-slate-200 px-2 py-1 font-mono text-xs font-bold uppercase outline-none focus:border-violet-500"
      />
      <button
        type="button"
        onClick={() => void saveColor()}
        className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-violet-100 hover:text-violet-700"
      >
        저장
      </button>
      {message && <span className="text-xs font-bold text-slate-500">{message}</span>}
    </div>
  )
}
