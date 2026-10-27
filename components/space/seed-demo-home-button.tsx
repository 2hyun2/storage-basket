'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SeedDemoHomeButton() {
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  async function saveDemoHome() {
    setIsSaving(true)
    setStatus(null)

    const { error } = await createClient().rpc('seed_demo_spatial_scenes')

    if (error) {
      setStatus(error.message)
      setIsSaving(false)
      return
    }

    setStatus('안방·거실 등의 cm 배치와 안방 벽·문·창문 샘플을 저장했습니다.')
    setIsSaving(false)
    router.refresh()
    window.setTimeout(() => window.location.reload(), 400)
  }

  return (
    <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-3">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm leading-6 text-violet-900">
          안방·거실 내부의 cm 배치와 벽·문·창문을 포함한 샘플을 DB에 저장합니다.
        </p>
        <button
          type="button"
          onClick={saveDemoHome}
          disabled={isSaving}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-violet-700 px-3 py-2 text-sm font-extrabold text-white transition hover:bg-violet-800 disabled:cursor-wait disabled:bg-violet-400"
        >
          <Sparkles size={16} />
          {isSaving ? '저장 중...' : '3D 구조 샘플 저장'}
        </button>
      </div>
      {status && <p className="mt-2 text-xs font-bold text-violet-700">{status}</p>}
    </div>
  )
}
