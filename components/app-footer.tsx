'use client'

import { useState } from 'react'
import { Copy, Lightbulb, Mail } from 'lucide-react'

const feedbackEmail = 'eventietter@naver.com'

export function AppFooter() {
  const [isCopied, setIsCopied] = useState(false)

  async function copyFeedbackEmail() {
    try {
      await navigator.clipboard.writeText(feedbackEmail)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2_000)
    } catch {
      setIsCopied(false)
    }
  }

  return (
    <footer className="border-t border-slate-200 bg-white px-2 py-5 sm:px-4">
      <div className="mx-auto flex max-w-5xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-extrabold text-slate-900">우리집 공간록</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">공간을 만들고, 물건의 자리를 함께 기억합니다.</p>
        </div>

        <div className="rounded-2xl bg-violet-50 px-3 py-2.5 sm:text-right">
          <p className="flex items-center gap-1.5 text-xs font-extrabold text-violet-950 sm:justify-end">
            <Lightbulb size={14} />
            문의 · 개선 제안
          </p>
          <div className="mt-1.5 flex items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-800"><Mail size={15} />{feedbackEmail}</span>
            <button type="button" onClick={() => void copyFeedbackEmail()} className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2 py-1 text-xs font-extrabold text-violet-700 hover:bg-violet-100">
              <Copy size={13} />
              {isCopied ? '복사됨' : '복사'}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
