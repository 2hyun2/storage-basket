import { SpaceDetailClient } from '@/components/space/space-detail-client'

export default async function SpaceLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>
  searchParams: Promise<{ draw?: string }>
}) {
  const { locationId } = await params
  const { draw } = await searchParams

  return <SpaceDetailClient locationId={locationId} draw={draw} />
}
