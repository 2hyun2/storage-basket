import { redirect } from 'next/navigation'

type SignupPageProps = {
  searchParams: Promise<{ invite?: string | string[] }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { invite } = await searchParams
  const code = typeof invite === 'string' ? invite.trim().toUpperCase() : ''

  if (code && code.length <= 20) {
    const query = new URLSearchParams({ invite: code })
    redirect(`/app/community?${query}`)
  }

  redirect('/login')
}
