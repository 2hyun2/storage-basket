'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { HOME_INVENTORY_QUERY_KEY } from '@/lib/space/use-supabase-inventory'
import { createClient } from '@/lib/supabase/client'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 15 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Home 데이터는 계정마다 완전히 분리된다. 로그인 상태가 바뀌는 순간
      // 이전 계정의 공간·물건 캐시를 제거해 잠깐이라도 섞여 보이지 않게 한다.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        queryClient.removeQueries({ queryKey: HOME_INVENTORY_QUERY_KEY })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
