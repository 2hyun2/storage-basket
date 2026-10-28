import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { AppFooter } from '@/components/app-footer'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type AppLayoutProps = Readonly<{ children: React.ReactNode }>

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()
  const displayName = profile?.display_name ?? user.user_metadata.display_name ?? user.email?.split('@')[0] ?? '사용자'
  const email = user.email ?? ''

  return (
    <div className="min-h-dvh bg-[#f8f7ff]">
      <AppHeader displayName={displayName} email={email} />
      {children}
      <AppFooter />
    </div>
  )
}
