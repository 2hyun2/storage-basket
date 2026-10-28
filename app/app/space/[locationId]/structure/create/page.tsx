import { StructureCreatePageClient } from '@/components/space/structure-create-page-client'

export default async function StructureCreatePage({
  params,
}: {
  params: Promise<{ locationId: string }>
}) {
  const { locationId } = await params

  return <StructureCreatePageClient locationId={locationId} />
}
