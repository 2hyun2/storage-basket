import { createClient } from '@/lib/supabase/server'
import { InventoryOverview } from '@/components/dashboard/inventory-overview'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.user_metadata.display_name ?? user?.email?.split('@')[0] ?? '사용자'

  return <InventoryOverview displayName={displayName} />
}
