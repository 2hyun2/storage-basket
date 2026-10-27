'use client'

import { useRouter } from 'next/navigation'
import { PlacementEditor, type ScenePlacementData } from '@/components/space/space-interior-3d'

export function DrawPlacementDialog({ locationId, name, layoutId, placement, bounds }: { locationId: string; name: string; layoutId: string | null; placement: ScenePlacementData | null; bounds: { widthCm: number; heightCm: number; depthCm: number } | null }) {
  const router = useRouter()

  if (!bounds || !layoutId) {
    return (
      <div className="relative grid h-[460px] place-items-center rounded-3xl bg-slate-950/80 p-4">
        <div className="max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
          <h2 className="font-extrabold">먼저 바깥 공간의 크기를 정해 주세요</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {name}의 자리를 정하려면 이 공간이 들어갈 곳의 가로와 세로가 필요합니다. 공간 화면에서 바깥 공간의 3D 자리를 먼저 정한 뒤 다시 시도해 주세요.
          </p>
          <button type="button" onClick={() => router.replace(`/app/space/${locationId}`)} className="mt-4 w-full rounded-xl bg-violet-600 py-2 text-sm font-extrabold text-white">돌아가기</button>
        </div>
      </div>
    )
  }

  return <div className="relative h-[460px]"><PlacementEditor space={{ id: locationId, name }} layoutId={layoutId} placement={placement} bounds={bounds} onClose={() => router.replace(`/app/space/${locationId}`)} /></div>
}
