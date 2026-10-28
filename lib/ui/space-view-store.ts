'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SpaceView = 'tree' | 'three'

type SpaceViewStore = {
  view: SpaceView
  setView: (view: SpaceView) => void
}

// 공간·물건 원본 데이터는 TanStack Query가 관리한다.
// 이 저장소는 사용자가 마지막으로 선택한 화면 방식만 기억한다.
export const useSpaceViewStore = create<SpaceViewStore>()(
  persist(
    (set) => ({
      view: 'tree',
      setView: (view) => set({ view }),
    }),
    {
      name: 'storage-basket-space-view',
    },
  ),
)
