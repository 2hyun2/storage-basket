import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/app')
  }

  return <main className="grid min-h-dvh place-items-center bg-[#f5f8fd] px-2 py-4 sm:px-4">{children}</main>
}
