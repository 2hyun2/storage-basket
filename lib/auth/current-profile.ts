import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// 한 번의 서버 렌더링에서 헤더와 페이지가 같은 프로필을 사용한다.
// 이름은 Auth 메타데이터 대신 profiles의 현재 값을 우선한다.
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, displayName: '사용자' }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error

  const displayName = profile?.display_name
    ?? user.user_metadata.display_name
    ?? user.user_metadata.full_name
    ?? user.email?.split('@')[0]
    ?? '사용자'

  return { user, displayName: String(displayName) }
})
