'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { refreshDisplayName } from '@/lib/space/query-cache'
import { defaultHomeName, isDefaultHomeName } from '@/lib/community/default-home-name'

type SupabaseClient = ReturnType<typeof createClient>

// 표시 이름 저장은 이미 끝났으므로 공동체 이름 변경 실패는 저장 실패로 처리하지 않고 결과만 알린다.
async function renameDefaultHomes(supabase: SupabaseClient, userId: string, nextDisplayName: string, previousNames: Array<string | null | undefined>) {
  const { data: ownerships, error: ownershipError } = await supabase.from('home_members')
    .select('home_id')
    .eq('user_id', userId)
    .eq('role', 'owner')
  if (ownershipError) return { renamed: 0, failed: true }

  const homeIds = (ownerships ?? []).map((ownership) => ownership.home_id)
  if (homeIds.length === 0) return { renamed: 0, failed: false }

  const { data: homes, error: homesError } = await supabase.from('homes').select('id, name').in('id', homeIds)
  if (homesError) return { renamed: 0, failed: true }

  const nextHomeName = defaultHomeName(nextDisplayName)
  const targets = (homes ?? []).filter((home) => home.name !== nextHomeName && isDefaultHomeName(home.name, previousNames))
  let renamed = 0
  for (const home of targets) {
    // 조회 뒤 다른 사람이 이름을 바꿨다면 덮어쓰지 않도록 기존 이름도 조건에 둔다.
    const { data, error } = await supabase.from('homes').update({ name: nextHomeName }).eq('id', home.id).eq('name', home.name).select('id')
    if (error) return { renamed, failed: true }
    renamed += data?.length ?? 0
  }
  return { renamed, failed: false }
}

const displayNameSchema = z.string().trim()
  .min(2, '이름은 2자 이상 입력해 주세요.')
  .max(30, '이름은 30자 이하로 입력해 주세요.')

export function DisplayNameForm({ displayName }: { displayName: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(displayName)
  const [message, setMessage] = useState('')

  const mutation = useMutation({
    mutationFn: async (input: string) => {
      const parsed = displayNameSchema.safeParse(input)
      if (!parsed.success) throw new Error(parsed.error.issues[0].message)

      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('다시 로그인한 뒤 수정해 주세요.')

      const { data: previousProfile, error: previousProfileError } = await supabase.from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle()

      const { data: profile, error } = await supabase.from('profiles')
        .update({ display_name: parsed.data })
        .eq('id', user.id)
        .select('id, display_name')
        .single()

      if (error) throw new Error('이름을 저장하지 못했어요. 다시 시도해 주세요.')

      // 내가 대표인 공동체 중 이름이 가입 때 자동으로 만든 기본 이름 그대로면 새 표시 이름에 맞춘다.
      // 기본 이름 후보: 직전 표시 이름, 가입 시 표시 이름이 없을 때 쓰인 이메일 아이디.
      // 직전 이름을 모르면 대상을 빠뜨린 채 성공으로 안내하게 되므로 변경하지 않고 실패로 알린다.
      // 프로필은 이미 저장됐으므로 공동체 이름 단계의 예외도 저장 실패로 전파하지 않는다.
      let homeRename = { renamed: 0, failed: true }
      if (!previousProfileError) {
        try {
          homeRename = await renameDefaultHomes(supabase, user.id, profile.display_name, [
            previousProfile?.display_name,
            user.email?.split('@')[0],
          ])
        } catch {
          homeRename = { renamed: 0, failed: true }
        }
      }
      return { profile, homeRename }
    },
    onSuccess: async ({ profile, homeRename }) => {
      setName(profile.display_name)
      await refreshDisplayName(queryClient, profile.id, profile.display_name)
      if (homeRename.renamed > 0) await queryClient.invalidateQueries({ queryKey: ['my-homes'] })
      setIsEditing(false)
      setMessage(homeRename.failed
        ? '표시 이름을 변경했어요. 공동체 이름은 바꾸지 못했으니 공동체 화면에서 직접 수정해 주세요.'
        : homeRename.renamed > 0
          ? '표시 이름을 변경했어요. 기본 공동체 이름도 함께 바꿨어요.'
          : '표시 이름을 변경했어요.')
      router.refresh()
    },
  })

  function startEditing() {
    setName(displayName)
    setMessage('')
    mutation.reset()
    setIsEditing(true)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!mutation.isPending) mutation.mutate(name)
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
          <UserRound size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-800">표시 이름</p>
          {!isEditing && <p className="mt-0.5 truncate text-sm text-slate-500">{displayName}</p>}
        </div>
        {!isEditing && (
          <button type="button" onClick={startEditing} className="text-sm font-bold text-violet-700 hover:underline">
            수정
          </button>
        )}
      </div>
      {isEditing && (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <label htmlFor="display-name" className="block text-sm text-slate-600">새 표시 이름 · 2~30자</label>
          <input
            id="display-name"
            name="displayName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="nickname"
            required
            maxLength={30}
            disabled={mutation.isPending}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          {mutation.error && <p role="alert" className="text-sm text-rose-700">{mutation.error.message}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-60"
            >
              취소
            </button>
            <button disabled={mutation.isPending} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">
              {mutation.isPending ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      )}
      {message && <p role="status" className="mt-2 text-sm text-emerald-700">{message}</p>}
    </div>
  )
}
