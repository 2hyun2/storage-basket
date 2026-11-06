'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { refreshDisplayName } from '@/lib/space/query-cache'

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

      const { data: profile, error } = await supabase.from('profiles')
        .update({ display_name: parsed.data })
        .eq('id', user.id)
        .select('id, display_name')
        .single()

      if (error) throw new Error('이름을 저장하지 못했어요. 다시 시도해 주세요.')
      return profile
    },
    onSuccess: async (profile) => {
      setName(profile.display_name)
      await refreshDisplayName(queryClient, profile.id, profile.display_name)
      setIsEditing(false)
      setMessage('표시 이름을 변경했어요.')
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
