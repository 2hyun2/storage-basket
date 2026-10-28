'use client'

import { useState } from 'react'
import { Copy, Crown, RefreshCw, UsersRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { invalidateHomeInventory, useSupabaseInventory } from '@/lib/space/use-supabase-inventory'
import { useQueryClient } from '@tanstack/react-query'

export function CommunityManager() {
  const { home, members, isLoading } = useSupabaseInventory()
  const queryClient = useQueryClient()
  const [editedName, setEditedName] = useState<string | null>(null)
  const [regeneratedInviteCode, setRegeneratedInviteCode] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) {
    return <p className="text-sm font-bold text-slate-500">공동체 정보를 불러오는 중입니다.</p>
  }

  if (!home) {
    return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">참여 중인 공동체를 찾지 못했습니다.</p>
  }

  const activeHome = home
  const name = editedName ?? activeHome.name
  const inviteCode = regeneratedInviteCode ?? activeHome.inviteCode
  const isOwner = activeHome.role === 'owner'
  const owner = members.find((member) => member.role === 'owner')

  async function saveName() {
    const nextName = name.trim()
    if (!nextName || nextName.length > 60) {
      setMessage('공동체 이름은 1~60자로 입력해 주세요.')
      return
    }

    setIsSaving(true)
    setMessage(null)
    const { error } = await createClient()
      .from('homes')
      .update({ name: nextName })
      .eq('id', activeHome.id)

    setIsSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }

    await invalidateHomeInventory(queryClient)
    setMessage('공동체 이름을 저장했습니다.')
  }

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setMessage('초대 코드를 복사했습니다.')
    } catch {
      setMessage('복사하지 못했습니다. 코드를 직접 전달해 주세요.')
    }
  }

  async function regenerateInviteCode() {
    if (!window.confirm('기존 초대 코드는 바로 사용할 수 없게 됩니다. 새 코드로 바꿀까요?')) {
      return
    }

    setIsSaving(true)
    setMessage(null)
    const { data, error } = await createClient()
      .rpc('regenerate_home_invite', { target_home_id: activeHome.id })

    setIsSaving(false)
    if (error || !data) {
      setMessage(error?.message ?? '초대 코드를 바꾸지 못했습니다.')
      return
    }

    setRegeneratedInviteCode(data)
    await invalidateHomeInventory(queryClient)
    setMessage('새 초대 코드를 만들었습니다.')
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-violet-100 bg-violet-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white"><UsersRound size={20} /></span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-violet-700">현재 공동체</p>
            <h2 className="mt-1 truncate text-2xl font-extrabold text-violet-950">{activeHome.name}</h2>
            <p className="mt-2 text-sm text-violet-800">대표 {owner?.displayName ?? '알 수 없음'} · 구성원 {members.length}명</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="font-extrabold text-slate-900">공동체 이름</h2>
        {isOwner ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input value={name} onChange={(event) => setEditedName(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-violet-500" />
            <button type="button" onClick={() => void saveName()} disabled={isSaving} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">저장</button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">대표만 공동체 이름을 바꿀 수 있습니다.</p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="font-extrabold text-slate-900">초대 코드</h2>
        {isOwner ? (
          <>
            <p className="mt-1 text-sm leading-6 text-slate-500">이 코드를 전달하면 새 구성원이 가입할 때 공동체 이름과 대표를 확인한 뒤 참여할 수 있습니다.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <strong className="rounded-xl bg-slate-950 px-4 py-2 font-mono text-lg tracking-[0.16em] text-white">{inviteCode}</strong>
              <button type="button" onClick={() => void copyInviteCode()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50"><Copy size={15} /> 복사</button>
              <button type="button" onClick={() => void regenerateInviteCode()} disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-sm font-extrabold text-rose-700 hover:bg-rose-50 disabled:opacity-60"><RefreshCw size={15} /> 새 코드 만들기</button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-600">초대 코드는 공동체 대표에게 요청해 주세요.</p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="font-extrabold text-slate-900">구성원 {members.length}명</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {members.map((member) => (
            <li key={member.userId} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <span className="min-w-0">
                <strong className="block truncate text-sm text-slate-900">{member.displayName}</strong>
                <span className="mt-0.5 block text-xs text-slate-500">{member.role === 'owner' ? '공동체 대표' : '구성원'}</span>
              </span>
              {member.role === 'owner' && <Crown size={17} className="shrink-0 text-amber-500" aria-label="공동체 대표" />}
            </li>
          ))}
        </ul>
      </section>

      {message && <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">{message}</p>}
    </div>
  )
}
