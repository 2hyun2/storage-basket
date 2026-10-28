'use client'

import { useCallback, useEffect, useState } from 'react'
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
  locationId: string
  xCm: number
  yCm: number
  zCm: number
  widthCm: number
  heightCm: number
  depthCm: number
}

export function useSupabaseInventory() {
  const [spaces, setSpaces] = useState<LocalSpace[]>([])
  const [items, setItems] = useState<LocalItem[]>([])
  const [homeId, setHomeId] = useState<string | null>(null)
  const [homeLayout, setHomeLayout] = useState<HomeLayout | null>(null)
  const [placements, setPlacements] = useState<SpacePlacement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      setSpaces([])
      setItems([])
      setHomeId(null)
      setHomeLayout(null)
      setPlacements([])
      setIsLoading(false)
      return
    }

    const { data: membership } = await supabase
      .from('home_members')
      .select('home_id')
      .eq('user_id', userId)
      .order('joined_at')
      .limit(1)
      .maybeSingle()

    if (!membership) {
      setSpaces([])
      setItems([])
      setHomeId(null)
      setHomeLayout(null)
      setPlacements([])
      setIsLoading(false)
      return
    }

    setHomeId(membership.home_id)
    const [locationsResult, itemsResult, layoutsResult] = await Promise.all([
      supabase.from('locations').select('*').eq('home_id', membership.home_id).is('deleted_at', null).order('created_at'),
      supabase.from('items').select('*').eq('home_id', membership.home_id).is('deleted_at', null).order('created_at'),
      supabase.from('space_layouts').select('id, width_cm, height_cm, depth_cm').eq('home_id', membership.home_id).eq('layout_key', 'home').maybeSingle(),
    ])

    const layout = layoutsResult.data

    if (layout) {
      const placementsResult = await supabase
        .from('space_placements')
        .select('location_id, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm')
        .eq('layout_id', layout.id)

      setHomeLayout({
        id: layout.id,
        widthCm: Number(layout.width_cm),
        heightCm: Number(layout.height_cm),
        depthCm: Number(layout.depth_cm),
      })
      setPlacements((placementsResult.data ?? []).map((placement) => ({
        locationId: placement.location_id,
        xCm: Number(placement.x_cm),
        yCm: Number(placement.y_cm),
        zCm: Number(placement.z_cm),
        widthCm: Number(placement.width_cm),
        heightCm: Number(placement.height_cm),
        depthCm: Number(placement.depth_cm),
      })))
    } else {
      setHomeLayout(null)
      setPlacements([])
    }

    setSpaces((locationsResult.data ?? []).map((location) => ({
      id: location.id,
      name: location.name,
      parentId: location.parent_id,
      mode: 'simple',
      placement: null,
      createdAt: location.created_at,
      isPanelVisible: location.is_panel_visible,
    })))
    setItems((itemsResult.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      locationId: item.location_id ?? '',
      quantity: Number(item.quantity),
      unit: item.unit ?? '',
      category: item.category,
      note: item.note,
      createdAt: item.created_at,
    })))
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [refresh])

  return { homeId, spaces, items, homeLayout, placements, isLoading, refresh }
}
