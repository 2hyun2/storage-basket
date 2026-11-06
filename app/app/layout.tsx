import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { AppFooter } from '@/components/app-footer'
import { getCurrentProfile } from '@/lib/auth/current-profile'

export const dynamic = 'force-dynamic'

type AppLayoutProps = Readonly<{ children: React.ReactNode }>

export default async function AppLayout({ children }: AppLayoutProps) {
  const { user, displayName } = await getCurrentProfile()
  if (!user) redirect('/login')

  const email = user.email ?? ''

  return (
    <div className="min-h-dvh bg-[#f5f8fd]">
      <AppHeader displayName={displayName} email={email} />
      {children}
      <AppFooter />
    </div>
  )
}
