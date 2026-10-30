'use client'

import { SpaceOverview3d } from '@/components/space/space-overview-3d'
import type { LocalSpace } from '@/lib/space/local-spaces'
import type { HomeLayout, SceneLayout, SceneStructure, SpacePlacement } from '@/lib/space/use-supabase-inventory'

// 인트로는 공개 화면이므로 로그인한 사용자의 데이터를 읽지 않는다.
// 아래 값은 제공받은 한 집의 공간 배치를 식별 정보 없이 옮긴 공개용 예시다.
const demoHomeLayout: HomeLayout = {
  id: 'landing-home-layout',
  widthCm: 600,
  heightCm: 250,
  depthCm: 300,
}

const demoSpaces: LocalSpace[] = [
  { id: 'landing-living', name: '거실', parentId: null, mode: 'map', placement: null, createdAt: '2026-01-01T00:00:00.000Z', colorHex: '#FFFFFF' },
  { id: 'landing-kitchen', name: '부엌', parentId: null, mode: 'map', placement: null, createdAt: '2026-01-01T00:00:01.000Z', colorHex: '#F59E0B' },
  { id: 'landing-bathroom', name: '화장실', parentId: null, mode: 'map', placement: null, createdAt: '2026-01-01T00:00:02.000Z', colorHex: '#14B8A6' },
  { id: 'landing-entrance', name: '현관', parentId: null, mode: 'map', placement: null, createdAt: '2026-01-01T00:00:03.000Z', colorHex: '#FFFFFF' },
  { id: 'landing-closet', name: '옷장', parentId: 'landing-living', mode: 'map', placement: null, createdAt: '2026-01-01T00:00:04.000Z', colorHex: '#0EA5E9' },
  { id: 'landing-boiler-room', name: '보일러실', parentId: 'landing-living', mode: 'map', placement: null, createdAt: '2026-01-01T00:00:05.000Z', colorHex: '#000000' },
  { id: 'landing-desk', name: '책상', parentId: 'landing-living', mode: 'map', placement: null, createdAt: '2026-01-01T00:00:06.000Z', colorHex: '#00FFFF' },
  { id: 'landing-fridge', name: '냉장고', parentId: 'landing-living', mode: 'map', placement: null, createdAt: '2026-01-01T00:00:07.000Z', colorHex: '#0062FF' },
  { id: 'landing-sink', name: '싱크대', parentId: 'landing-kitchen', mode: 'map', placement: null, createdAt: '2026-01-01T00:00:08.000Z', colorHex: '#FFFFFF' },
  { id: 'landing-shoe-cabinet', name: '신발장', parentId: 'landing-entrance', mode: 'map', placement: null, createdAt: '2026-01-01T00:00:09.000Z', colorHex: '#F0F0F0' },
]

const demoLayouts: SceneLayout[] = [
  { id: 'landing-bathroom-layout', layoutKey: 'location:landing-bathroom', sceneLocationId: 'landing-bathroom', viewKind: 'interior', widthCm: 200, heightCm: 100, depthCm: 100 },
  { id: demoHomeLayout.id, layoutKey: 'home', sceneLocationId: null, viewKind: 'plan', widthCm: 600, heightCm: 250, depthCm: 300 },
  { id: 'landing-living-layout', layoutKey: 'location:landing-living', sceneLocationId: 'landing-living', viewKind: 'interior', widthCm: 400, heightCm: 102, depthCm: 300 },
  { id: 'landing-kitchen-layout', layoutKey: 'location:landing-kitchen', sceneLocationId: 'landing-kitchen', viewKind: 'interior', widthCm: 130, heightCm: 100, depthCm: 200 },
  { id: 'landing-entrance-layout', layoutKey: 'location:landing-entrance', sceneLocationId: 'landing-entrance', viewKind: 'interior', widthCm: 70, heightCm: 100, depthCm: 200 },
]

const demoPlacements: SpacePlacement[] = [
  placement('home-living', demoHomeLayout.id, 'landing-living', 200, 0, 0, 400, 102, 300),
  placement('home-kitchen', demoHomeLayout.id, 'landing-kitchen', 70, 0, 0, 130, 100, 200),
  placement('home-bathroom', demoHomeLayout.id, 'landing-bathroom', 0, 0, 200, 200, 100, 100),
  placement('home-entrance', demoHomeLayout.id, 'landing-entrance', 0, 0, 0, 70, 100, 200),
  placement('living-closet', 'landing-living-layout', 'landing-closet', 200, 0, 0, 80, 100, 50),
  placement('living-boiler-room', 'landing-living-layout', 'landing-boiler-room', 280, 0, 0, 120, 100, 50),
  placement('living-desk', 'landing-living-layout', 'landing-desk', 50, 0, 0, 150, 100, 50),
  placement('living-fridge', 'landing-living-layout', 'landing-fridge', 0, 0, 0, 50, 100, 50),
  placement('kitchen-sink', 'landing-kitchen-layout', 'landing-sink', 0, 0, 0, 130, 100, 50),
  placement('entrance-shoe-cabinet', 'landing-entrance-layout', 'landing-shoe-cabinet', 0, 0, 0, 70, 100, 50),
]

const demoStructures: SceneStructure[] = [
  structure('bathroom-edge', 'landing-bathroom-layout', 'wall', '테투리 벽', 0, 99, 200, 1),
  structure('bathroom-hall', 'landing-bathroom-layout', 'wall', '복도 벽', 0, 0, 20, 99),
  structure('bathroom-kitchen', 'landing-bathroom-layout', 'wall', '부엌 벽', 20, 0, 150, 20),
  structure('living-window', 'landing-living-layout', 'window', '통창', 385, 50, 15, 250),
  structure('living-edge', 'landing-living-layout', 'wall', '벽', 0, 299, 385, 1),
  structure('living-side', 'landing-living-layout', 'wall', '벽 2', 0, 199, 20, 100),
]

function structure(
  id: string,
  layoutId: string,
  kind: 'wall' | 'window',
  name: string,
  xCm: number,
  zCm: number,
  widthCm: number,
  depthCm: number,
): SceneStructure {
  return {
    id,
    layoutId,
    kind,
    name,
    xCm,
    yCm: 0,
    zCm,
    widthCm,
    heightCm: 100,
    depthCm,
    colorHex: '#FFFFFF',
    isLabelVisible: false,
  }
}

export function LandingHomeDemo() {
  return (
    <section className="flex h-full min-h-80 flex-col overflow-hidden bg-[#f8fafc]">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
        <span className='text-base text-violet-600'>실제 원룸 배치값 예시</span>
        {/* <span className="text-violet-600">10cm 격자</span> */}
      </div>
      <SpaceOverview3d
        spaces={demoSpaces}
        homeLayout={demoHomeLayout}
        layouts={demoLayouts}
        placements={demoPlacements}
        structures={demoStructures}
        compact
        fillHeight
        interactive={false}
      />
      {/* <div className="grid grid-cols-3 border-t border-slate-100 bg-white text-center text-[10px] font-bold text-slate-500"> */}
        {/* <span className="py-2">첫 공간 4개</span> */}
        {/* <span className="border-x border-slate-100 py-2">내부 공간 6개</span> */}
        {/* <span className="py-2">미배치 0개</span> */}
      {/* </div> */}
    </section>
  )
}

function placement(
  id: string,
  layoutId: string,
  locationId: string,
  xCm: number,
  yCm: number,
  zCm: number,
  widthCm: number,
  heightCm: number,
  depthCm: number,
): SpacePlacement {
  return { id, layoutId, locationId, xCm, yCm, zCm, widthCm, heightCm, depthCm }
}
