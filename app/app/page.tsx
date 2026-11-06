import { getCurrentProfile } from '@/lib/auth/current-profile'
import { InventoryOverview } from '@/components/dashboard/inventory-overview'

export default async function AppPage() {
  const { displayName } = await getCurrentProfile()

  return <InventoryOverview displayName={displayName} />
}
