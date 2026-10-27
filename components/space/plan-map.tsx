import Link from 'next/link'
import { Box, ChevronRight, DoorOpen, PackageOpen } from 'lucide-react'
import type { SpaceLayout, SpaceNode } from '@/lib/space/types'

type PlanMapProps = {
  layout: SpaceLayout
}

export function PlanMap({ layout }: PlanMapProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white p-2 shadow-sm sm:p-4">
      <div className="mb-4 flex items-center justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-500">
            {layout.viewMode === 'plan' ? 'Floor plan' : 'Storage layout'}
          </p>
          <p className="mt-1 text-sm text-slate-500">구역을 선택해 내부로 들어가세요.</p>
        </div>
        <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
          {layout.nodes.length}개 구역
        </span>
      </div>

      <div className="relative aspect-[5/3] min-h-72 overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 p-1">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]" />
        {layout.nodes.map((node) => (
          <LocationTile key={node.id} node={node} grid={layout.grid} />
        ))}
      </div>

      <p className="mt-4 px-1 text-xs leading-5 text-slate-400">
        샘플 평면도입니다. 모든 구역은 부모 안에서 1칸 이상의 여백을 유지하며 서로 겹치지 않습니다.
      </p>
    </div>
  )
}

type LocationTileProps = {
  node: SpaceNode
  grid: SpaceLayout['grid']
}

function LocationTile({ node, grid }: LocationTileProps) {
  const href = `/app/space/${node.id}`
  const left = `${(node.rect.x / grid.width) * 100}%`
  const top = `${(node.rect.y / grid.height) * 100}%`
  const width = `${(node.rect.width / grid.width) * 100}%`
  const height = `${(node.rect.height / grid.height) * 100}%`
  const Icon = node.kind === 'room' ? DoorOpen : node.kind === 'box' ? PackageOpen : Box

  const content = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-white/20 sm:size-8">
          <Icon size={16} strokeWidth={2.25} />
        </span>
        {node.drillable && (
          <ChevronRight size={16} className="opacity-75 transition group-hover:translate-x-0.5" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-extrabold tracking-tight sm:text-base">{node.name}</span>
        {node.itemCount !== undefined && (
          <span className="mt-0.5 block text-[11px] font-medium text-white/80 sm:text-xs">
            물건 {node.itemCount}개
          </span>
        )}
      </span>
    </>
  )

  const className = "group absolute flex min-w-0 flex-col justify-between rounded-xl border border-white/40 p-2 text-left text-white shadow-sm transition sm:p-2"
  const style = { left, top, width, height, backgroundColor: node.color }

  if (!node.drillable) {
    return (
      <div style={style} className={`${className} cursor-default`}>
        {content}
      </div>
    )
  }

  return (
    <Link
      href={href}
      style={{ left, top, width, height, backgroundColor: node.color }}
      className={`${className} hover:z-10 hover:scale-[1.02] hover:shadow-lg focus:z-10 focus:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-violet-300`}
    >
      {content}
    </Link>
  )
}
