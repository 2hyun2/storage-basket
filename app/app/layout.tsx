import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type AppLayoutProps = Readonly<{ children: React.ReactNode }>

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <>{children}</>
}
