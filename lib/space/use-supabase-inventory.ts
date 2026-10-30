'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { cachedRows, readAllPages } from '@/lib/space/paged-query'
import { HOME_INVENTORY_QUERY_KEY, invalidateHomeInventory } from '@/lib/space/query-cache'
export { HOME_INVENTORY_QUERY_KEY, invalidateHomeInventory } from '@/lib/space/query-cache'
import { createClient } from '@/lib/supabase/client'
import type { LocalItem } from '@/lib/space/local-items'
import type { LocalSpace } from '@/lib/space/local-spaces'


export type HomeLayout = {
  id: string
  widthCm: number
  heightCm: number
  depthCm: number
}

export type SpacePlacement = {
  id: string
  layoutId: string
  locationId: string
  xCm: number
  yCm: number
  zCm: number
  widthCm: number
  heightCm: number
  depthCm: number
}

export type SceneStructure = {
  id: string
  layoutId: string
  kind: 'wall' | 'window'
  name: string
  colorHex?: string
  isLabelVisible?: boolean
  xCm: number
  yCm: number
  zCm: number
  widthCm: number
  heightCm: number
  depthCm: number
}

export type SceneLayout = {
  id: string
  layoutKey: string
  sceneLocationId: string | null
  viewKind: 'plan' | 'interior'
  widthCm: number
  heightCm: number
  depthCm: number
}

export type ActiveHome = {
  id: string
  name: string
  inviteCode: string
  role: 'owner' | 'member'
}

export type HomeMember = {
  userId: string
  displayName: string
  role: 'owner' | 'member'
  joinedAt: string
}

type HomeInventory = {
  homeId: string | null
  home: ActiveHome | null
  members: HomeMember[]
  spaces: LocalSpace[]
  items: LocalItem[]
  homeLayout: HomeLayout | null
  layouts: SceneLayout[]
  placements: SpacePlacement[]
  structures: SceneStructure[]
}

type StructureQueryRow = {
  id: string
  layout_id: string
  kind: string
  name: string
  x_cm: number
  y_cm: number
  z_cm: number
  width_cm: number
  height_cm: number
  depth_cm: number
  color_hex?: string | null
  is_label_visible?: boolean | null
}

const emptyInventory: HomeInventory = {
  homeId: null,
  home: null,
  members: [],
  spaces: [],
  items: [],
  homeLayout: null,
  layouts: [],
  placements: [],
  structures: [],
}

async function fetchHomeInventory(queryClient: QueryClient): Promise<HomeInventory> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id

  if (!userId) {
    return emptyInventory
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('active_home_id')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  let membershipQuery = supabase
    .from('home_members')
    .select('home_id, role')
    .eq('user_id', userId)
    .order('joined_at')
    .limit(1)

  if (profile?.active_home_id) {
    membershipQuery = membershipQuery.eq('home_id', profile.active_home_id)
  }

  const { data: membership, error: membershipError } = await membershipQuery.maybeSingle()

  if (membershipError) {
    throw membershipError
  }

  if (!membership) {
    return emptyInventory
  }

  const [homeResult, membersResult, locationsResult, itemsResult, layoutsResult] = await Promise.all([
    supabase
      .from('homes')
      .select('id, name, invite_code')
      .eq('id', membership.home_id)
      .maybeSingle(),
    cachedRows(queryClient, 'home_members', membership.home_id, (from, to) => supabase
      .from('home_members')
      .select('user_id, role, joined_at')
      .eq('home_id', membership.home_id)
      .order('joined_at').order('user_id').range(from, to)),
    cachedRows(queryClient, 'locations', membership.home_id, (from, to) => supabase
      .from('locations')
      .select('id, name, parent_id, created_at, is_panel_visible, color_hex')
      .eq('home_id', membership.home_id)
      .is('deleted_at', null)
      .order('created_at').order('id').range(from, to)),
    cachedRows(queryClient, 'items', membership.home_id, (from, to) => supabase
      .from('items')
      .select('id, title, location_id, quantity, unit, category, note, created_at')
      .eq('home_id', membership.home_id)
      .is('deleted_at', null)
      .order('created_at').order('id').range(from, to)),
    cachedRows(queryClient, 'space_layouts', membership.home_id, (from, to) => supabase
      .from('space_layouts')
      .select('id, layout_key, scene_location_id, view_kind, width_cm, height_cm, depth_cm')
      .eq('home_id', membership.home_id).order('id').range(from, to)),
  ])

  for (const result of [homeResult, membersResult, locationsResult, itemsResult, layoutsResult]) {
    if (result.error) {
      throw result.error
    }
  }

  const layouts = layoutsResult.data ?? []
  const members = membersResult.data ?? []
  const memberUserIds = members.map((member) => member.user_id)
  const { data: memberProfiles, error: memberProfilesError } = memberUserIds.length > 0
    ? await cachedRows(queryClient, 'profiles', membership.home_id, (from, to) => supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', memberUserIds).order('id').range(from, to))
    : { data: [], error: null }

  if (memberProfilesError) {
    throw memberProfilesError
  }
  const profileNames = new Map((memberProfiles ?? []).map((memberProfile) => [memberProfile.id, memberProfile.display_name]))
  const layoutIds = layouts.map((layout) => layout.id)
  const [placementsResult, structuresResult] = layoutIds.length > 0
    ? await Promise.all([
        cachedRows(queryClient, 'space_placements', membership.home_id, (from, to) => supabase
          .from('space_placements')
          .select('id, layout_id, location_id, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm')
          .in('layout_id', layoutIds).order('id').range(from, to)),
        cachedRows(queryClient, 'scene_structures', membership.home_id, (from, to) => supabase
          .from('scene_structures')
          .select('id, layout_id, kind, name, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm, color_hex, is_label_visible')
          .in('layout_id', layoutIds).order('id').range(from, to)),
      ])
    : [{ data: [], error: null }, { data: [], error: null }]

  if (placementsResult.error) {
    throw placementsResult.error
  }

  let structureRows: StructureQueryRow[] = structuresResult.data ?? []
  if (structuresResult.error) {
    const isNewDisplayColumnMissing = /color_hex|is_label_visible/i.test(
      structuresResult.error.message,
    )

    if (!isNewDisplayColumnMissing || layoutIds.length === 0) {
      throw structuresResult.error
    }

    // 새 표시 설정용 SQL을 아직 적용하지 않은 기존 Home도
    // 공간·물건·구조물 화면이 멈추지 않도록 이전 열 구성으로 한 번 더 읽는다.
    structureRows = await readAllPages((from, to) => supabase
      .from('scene_structures')
      .select('id, layout_id, kind, name, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm')
      .in('layout_id', layoutIds).order('id').range(from, to))
  }

  const homeLayoutRow = layouts.find((layout) => layout.layout_key === 'home')

  return {
    homeId: membership.home_id,
    home: homeResult.data
      ? {
          id: homeResult.data.id,
          name: homeResult.data.name,
          inviteCode: homeResult.data.invite_code,
          role: membership.role as ActiveHome['role'],
        }
      : null,
    members: members.map((member) => ({
      userId: member.user_id,
      displayName: profileNames.get(member.user_id) ?? '구성원',
      role: member.role as HomeMember['role'],
      joinedAt: member.joined_at,
    })),
    spaces: (locationsResult.data ?? []).map((location) => ({
      id: location.id,
      name: location.name,
      parentId: location.parent_id,
      mode: 'simple',
      placement: null,
      createdAt: location.created_at,
      isPanelVisible: location.is_panel_visible,
      colorHex: location.color_hex,
    })),
    items: (itemsResult.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      locationId: item.location_id ?? '',
      quantity: Number(item.quantity),
      unit: item.unit ?? '',
      category: item.category,
      note: item.note,
      createdAt: item.created_at,
    })),
    homeLayout: homeLayoutRow
      ? {
          id: homeLayoutRow.id,
          widthCm: Number(homeLayoutRow.width_cm),
          heightCm: Number(homeLayoutRow.height_cm),
          depthCm: Number(homeLayoutRow.depth_cm),
        }
      : null,
    layouts: layouts.map((layout) => ({
      id: layout.id,
      layoutKey: layout.layout_key,
      sceneLocationId: layout.scene_location_id,
      viewKind: layout.view_kind as SceneLayout['viewKind'],
      widthCm: Number(layout.width_cm),
      heightCm: Number(layout.height_cm),
      depthCm: Number(layout.depth_cm),
    })),
    placements: (placementsResult.data ?? []).map((placement) => ({
      id: placement.id,
      layoutId: placement.layout_id,
      locationId: placement.location_id,
      xCm: Number(placement.x_cm),
      yCm: Number(placement.y_cm),
      zCm: Number(placement.z_cm),
      widthCm: Number(placement.width_cm),
      heightCm: Number(placement.height_cm),
      depthCm: Number(placement.depth_cm),
    })),
    structures: structureRows.map((structure) => ({
      id: structure.id,
      layoutId: structure.layout_id,
      kind: structure.kind as SceneStructure['kind'],
      name: structure.name,
      xCm: Number(structure.x_cm),
      yCm: Number(structure.y_cm),
      zCm: Number(structure.z_cm),
      widthCm: Number(structure.width_cm),
      heightCm: Number(structure.height_cm),
      depthCm: Number(structure.depth_cm),
      colorHex: structure.color_hex ?? undefined,
      isLabelVisible: structure.is_label_visible ?? true,
    })),
  }
}

export function useSupabaseInventory() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: HOME_INVENTORY_QUERY_KEY,
    queryFn: () => fetchHomeInventory(queryClient),
    refetchOnWindowFocus: true,
  })
  const data = query.data ?? emptyInventory
  const refresh = useCallback(async () => {
    await invalidateHomeInventory(queryClient)
  }, [queryClient])

  return {
    ...data,
    isLoading: query.isPending,
    error: query.error,
    refresh,
  }
}
