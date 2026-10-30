import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/app')
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f5f8fd] px-2 py-4 sm:px-4">
      {children}
      <Link href="/guide" className="text-sm font-medium text-violet-700 hover:underline">처음이신가요? 사용 가이드 보기</Link>
    </main>
  )
}
