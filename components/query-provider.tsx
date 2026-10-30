'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 15 * 60_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  })
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScope] = useState(() => ({ client: makeQueryClient(), version: 0 }))
  const current = useRef(scope.client)
  const identity = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextId = session?.user.id ?? null
      if (identity.current !== nextId) {
        identity.current = nextId
        // 계정 전환 시 진행 중 요청, 모든 서버 캐시, 열린 편집 폼을 분리한다.
        const previous = current.current
        const client = makeQueryClient()
        current.current = client
        void previous.cancelQueries()
        previous.clear()
        setScope((value) => ({ client, version: value.version + 1 }))
      } else if (event === 'USER_UPDATED') {
        void current.current.invalidateQueries()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <QueryClientProvider key={scope.version} client={scope.client}>{children}</QueryClientProvider>
}
