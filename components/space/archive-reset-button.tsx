'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ArchiveResetButton() {
  const [status, setStatus] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const router = useRouter()

  async function resetHome() {
    if (!window.confirm('현재 더미 데이터는 백업한 뒤 공간·물건·3D 배치만 모두 비웁니다. 계속할까요?')) return
    setIsResetting(true)
    const resetRequest = createClient().rpc('archive_and_reset_current_home')
    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('처리 시간이 초과되었습니다. DB 함수를 다시 실행한 뒤 재시도해 주세요.')), 15000)
    })

    let error: { message: string } | null = null

    try {
      const result = await Promise.race([resetRequest, timeout])
      error = result.error
    } catch (requestError) {
      setStatus(requestError instanceof Error ? requestError.message : '초기화 요청을 처리하지 못했습니다.')
      setIsResetting(false)
      return
    }
    if (error) {
      setStatus(error.message)
      setIsResetting(false)
      return
    }
    router.replace('/app/space')
    router.refresh()
  }

  return <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6 text-amber-900">현재 더미는 백업하고, 이 Home의 공간·물건·3D 설계만 비웁니다.</p><button type="button" onClick={resetHome} disabled={isResetting} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-700 px-3 py-2 text-sm font-extrabold text-white disabled:bg-amber-300"><RotateCcw size={16} />{isResetting ? '백업·초기화 중...' : '더미 백업 후 초기화'}</button></div>{status && <p className="mt-2 text-xs font-bold text-rose-700">{status}</p>}</div>
}
