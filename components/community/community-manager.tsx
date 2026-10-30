'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Crown, Link2, RefreshCw, UsersRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { invalidateHomeInventory, useSupabaseInventory } from '@/lib/space/use-supabase-inventory'

type InvitePreview = {
  home_id: string
  home_name: string
  owner_name: string
}

type JoinedHome = {
  id: string
  name: string
  role: 'owner' | 'member'
}

export function CommunityManager() {
  const { home, members, isLoading } = useSupabaseInventory()
  const queryClient = useQueryClient()
  const joinedHomesQuery = useQuery({
    queryKey: ['my-homes'],
    queryFn: fetchJoinedHomes,
  })
  const [editedName, setEditedName] = useState<string | null>(null)
  const [regeneratedInviteCode, setRegeneratedInviteCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinPreview, setJoinPreview] = useState<InvitePreview | null>(null)
  const [isJoinConfirmed, setIsJoinConfirmed] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCheckingJoin, setIsCheckingJoin] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [switchingHomeId, setSwitchingHomeId] = useState<string | null>(null)

  if (isLoading) {
    return <p className="text-sm font-bold text-slate-500">공동체 정보를 불러오는 중입니다.</p>
  }

  if (!home) {
    return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">참여 중인 공동체를 찾지 못했습니다.</p>
  }

  const activeHome = home
  const name = editedName ?? activeHome.name
  const inviteCode = regeneratedInviteCode ?? activeHome.inviteCode
  const isOwner = activeHome.role === 'owner'
  const owner = members.find((member) => member.role === 'owner')
  const joinedHomes = joinedHomesQuery.data ?? []

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

    await refreshHomes(queryClient)
    setMessage('공동체 이름을 저장했습니다.')
  }

  async function copyText(value: string, successMessage: string, failureMessage: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(successMessage)
    } catch {
      setMessage(failureMessage)
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

  async function checkJoinCode() {
    const normalizedCode = joinCode.trim().toUpperCase()
    if (!normalizedCode) {
      setJoinPreview(null)
      setMessage('초대 코드를 입력해 주세요.')
      return
    }

    setIsCheckingJoin(true)
    setMessage(null)
    setIsJoinConfirmed(false)
    const { data, error } = await createClient()
      .rpc('preview_home_invite', { invite_code_input: normalizedCode })
      .maybeSingle<InvitePreview>()
    setIsCheckingJoin(false)

    if (error || !data) {
      setJoinPreview(null)
      setMessage('코드를 찾지 못했습니다. 공동체 대표에게 다시 확인해 주세요.')
      return
    }

    if (data.home_id === activeHome.id) {
      setJoinPreview(null)
      setMessage('이미 보고 있는 공동체의 코드입니다.')
      return
    }

    setJoinCode(normalizedCode)
    setJoinPreview(data)
  }

  async function joinCommunity() {
    if (!joinPreview || !isJoinConfirmed) {
      setMessage('공동체 이름과 대표를 확인한 뒤 참여해 주세요.')
      return
    }

    setIsJoining(true)
    setMessage(null)
    const { error } = await createClient()
      .rpc('join_home_with_invite', { invite_code_input: joinCode })
    setIsJoining(false)

    if (error) {
      setMessage(error.message)
      return
    }

    const joinedHomeName = joinPreview.home_name
    setJoinCode('')
    setJoinPreview(null)
    setIsJoinConfirmed(false)
    await refreshHomes(queryClient)
    setMessage(`“${joinedHomeName}”에 참여했습니다. 이제 이 공동체를 보고 있습니다.`)
  }

  async function switchHome(homeId: string) {
    if (homeId === activeHome.id) {
      return
    }

    setSwitchingHomeId(homeId)
    setMessage(null)
    const { error } = await createClient().rpc('set_active_home', { target_home_id: homeId })
    setSwitchingHomeId(null)

    if (error) {
      setMessage(error.message)
      return
    }

    await invalidateHomeInventory(queryClient)
    setMessage('보고 있는 공동체를 바꿨습니다.')
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-violet-100 bg-violet-50 p-4 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white"><UsersRound size={20} /></span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-violet-700">현재 공동체</p>
            <h2 className="mt-1 truncate text-2xl font-semibold text-violet-950">{activeHome.name}</h2>
            <p className="mt-2 text-sm text-violet-800">대표 {owner?.displayName ?? '알 수 없음'} · 구성원 {members.length}명</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-4">
        <h2 className="font-semibold text-slate-900">내 공동체</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">공동체를 바꾸면 공간과 물건도 해당 공동체 기준으로 표시됩니다.</p>
        <ul className="mt-3 divide-y divide-slate-100">
          {joinedHomes.map((joinedHome) => {
            const isActive = joinedHome.id === activeHome.id

            return (
              <li key={joinedHome.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0">
                  <strong className="block truncate text-sm text-slate-900">{joinedHome.name}</strong>
                  <span className="mt-0.5 block text-xs text-slate-500">{joinedHome.role === 'owner' ? '내가 대표' : '구성원'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => void switchHome(joinedHome.id)}
                  disabled={isActive || switchingHomeId === joinedHome.id}
                  className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-default disabled:border-violet-200 disabled:bg-violet-50 disabled:text-violet-700"
                >
                  {isActive ? '보고 있음' : switchingHomeId === joinedHome.id ? '바꾸는 중' : '이곳 보기'}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-4">
        <h2 className="font-semibold text-slate-900">공동체 참여</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">이미 계정이 있어도 초대 코드로 다른 공동체에 참여할 수 있습니다.</p>
        <div className="mt-3 flex gap-2">
          <input
            value={joinCode}
            onChange={(event) => {
              setJoinCode(event.target.value.toUpperCase())
              setJoinPreview(null)
              setIsJoinConfirmed(false)
            }}
            placeholder="예: A1B2C3D4"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold tracking-[0.12em] outline-none focus:border-violet-500"
          />
          <button type="button" onClick={() => void checkJoinCode()} disabled={isCheckingJoin} className="shrink-0 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-60">
            {isCheckingJoin ? '확인 중' : '확인'}
          </button>
        </div>
        {joinPreview && (
          <div className="mt-3 rounded-xl bg-violet-50 p-3">
            <p className="font-semibold text-violet-950">{joinPreview.home_name}</p>
            <p className="mt-1 text-sm text-violet-800">대표 {joinPreview.owner_name}</p>
            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-violet-950">
              <input type="checkbox" checked={isJoinConfirmed} onChange={(event) => setIsJoinConfirmed(event.target.checked)} className="mt-0.5 size-4" />
              <span>위 공동체에 구성원으로 참여하는 것을 확인했습니다.</span>
            </label>
            <button type="button" onClick={() => void joinCommunity()} disabled={!isJoinConfirmed || isJoining} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300">
              <Check size={16} />
              {isJoining ? '참여 중' : '이 공동체에 참여'}
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-4">
        <h2 className="font-semibold text-slate-900">공동체 이름</h2>
        {isOwner ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input value={name} onChange={(event) => setEditedName(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-violet-500" />
            <button type="button" onClick={() => void saveName()} disabled={isSaving} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">저장</button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">대표만 공동체 이름을 바꿀 수 있습니다.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-4">
        <h2 className="font-semibold text-slate-900">초대하기</h2>
        {isOwner ? (
          <>
            <p className="mt-1 text-sm leading-6 text-slate-500">코드나 링크를 전달하면 새 구성원이 공동체 이름과 대표를 확인한 뒤 참여할 수 있습니다.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <strong className="rounded-xl bg-slate-950 px-4 py-2 font-mono text-lg tracking-[0.16em] text-white">{inviteCode}</strong>
              <button type="button" onClick={() => void copyText(inviteCode, '초대 코드를 복사했습니다.', '복사하지 못했습니다. 코드를 직접 전달해 주세요.')} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Copy size={15} /> 코드 복사</button>
              <button type="button" onClick={() => void copyInviteLink(inviteCode, setMessage)} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50"><Link2 size={15} /> 링크 복사</button>
              <button type="button" onClick={() => void regenerateInviteCode()} disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"><RefreshCw size={15} /> 새 코드 만들기</button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-600">초대 코드는 공동체 대표에게 요청해 주세요.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-4">
        <h2 className="font-semibold text-slate-900">구성원 {members.length}명</h2>
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

async function refreshHomes(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    invalidateHomeInventory(queryClient),
    queryClient.invalidateQueries({ queryKey: ['my-homes'] }),
  ])
}

async function copyInviteLink(inviteCode: string, setMessage: (message: string) => void) {
  const inviteLink = new URL('/signup', window.location.origin)
  inviteLink.searchParams.set('invite', inviteCode)

  try {
    await navigator.clipboard.writeText(inviteLink.toString())
    setMessage('초대 링크를 복사했습니다.')
  } catch {
    setMessage('링크를 복사하지 못했습니다. 초대 코드를 직접 전달해 주세요.')
  }
}

async function fetchJoinedHomes(): Promise<JoinedHome[]> {
  const supabase = createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError

  const userId = userData.user?.id
  if (!userId) return []

  const { data: memberships, error: membershipsError } = await supabase
    .from('home_members')
    .select('home_id, role, joined_at')
    .eq('user_id', userId)
    .order('joined_at')
  if (membershipsError) throw membershipsError

  const homeIds = (memberships ?? []).map((membership) => membership.home_id)
  if (homeIds.length === 0) return []

  const { data: homes, error: homesError } = await supabase
    .from('homes')
    .select('id, name')
    .in('id', homeIds)
  if (homesError) throw homesError

  const homeNames = new Map((homes ?? []).map((joinedHome) => [joinedHome.id, joinedHome.name]))

  return (memberships ?? []).flatMap((membership) => {
    const name = homeNames.get(membership.home_id)
    return name
      ? [{ id: membership.home_id, name, role: membership.role as JoinedHome['role'] }]
      : []
  })
}
