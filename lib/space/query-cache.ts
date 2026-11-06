import type { QueryClient } from '@tanstack/react-query'

export const HOME_INVENTORY_QUERY_KEY = ['home-inventory'] as const

type ProfileName = { id: string; display_name: string }
type InventoryWithMemberNames = {
  members: Array<{ userId: string; displayName: string }>
}

export async function refreshDisplayName(
  queryClient: QueryClient,
  userId: string,
  displayName: string,
) {
  // 저장 전에 시작된 응답이 새 이름을 덮어쓰지 않게 먼저 취소한다.
  await queryClient.cancelQueries({
    predicate: (query) => query.queryKey[0] === HOME_INVENTORY_QUERY_KEY[0]
      || (query.queryKey[0] === 'inventory-table' && query.queryKey[1] === 'profiles'),
  })

  queryClient.setQueriesData<ProfileName[]>(
    { queryKey: ['inventory-table', 'profiles'] },
    (profiles) => profiles?.map((profile) => profile.id === userId
      ? { ...profile, display_name: displayName }
      : profile),
  )
  queryClient.setQueriesData<InventoryWithMemberNames>(
    { queryKey: HOME_INVENTORY_QUERY_KEY },
    (inventory) => inventory && ({
      ...inventory,
      members: inventory.members.map((member) => member.userId === userId
        ? { ...member, displayName }
        : member),
    }),
  )

  await invalidateHomeInventory(queryClient, ['profiles'])
}

export async function invalidateHomeInventory(queryClient: QueryClient, tables?: string[]) {
  const matchesTable = (key: readonly unknown[]) => key[0] === 'inventory-table'
    && (!tables || tables.includes(String(key[1])))

  // 저장 전 시작한 조회가 저장 후 결과를 덮어쓰지 못하도록 먼저 취소한다.
  await queryClient.cancelQueries({
    predicate: (query) => matchesTable(query.queryKey) || query.queryKey[0] === HOME_INVENTORY_QUERY_KEY[0],
  })
  await queryClient.invalidateQueries({
    predicate: (query) => matchesTable(query.queryKey),
    refetchType: 'none',
  })
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: HOME_INVENTORY_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ['activity-events'] }),
    queryClient.invalidateQueries({ queryKey: ['item-activity-preview'] }),
  ])
}
