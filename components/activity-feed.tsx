'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { Box, Construction, History, MapPinned, Package, Ruler } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'

type ActivityEntityType = 'location' | 'item' | 'structure' | 'layout'
type ActivityAction = 'created' | 'updated' | 'moved' | 'deleted' | 'restored'

type ActivityEvent = {
  id: string
  entityType: ActivityEntityType
  entityId: string | null
  action: ActivityAction
  actorId: string | null
  beforeData: Record<string, unknown> | null
  afterData: Record<string, unknown> | null
  createdAt: string
}

type ActivityFilter = 'all' | ActivityEntityType

export function ActivityFeed() {
  const searchParams = useSearchParams()
  const { homeId, members } = useSupabaseInventory()
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const itemId = searchParams.get('item')
  const locationId = searchParams.get('space')
  const structureId = searchParams.get('structure')
  const focusedEntityId = itemId ?? locationId ?? structureId
  const focusedEntityType: ActivityEntityType | null = itemId
    ? 'item'
    : locationId
      ? 'location'
      : structureId
        ? 'structure'
        : null

  const activityQuery = useQuery({
    queryKey: ['activity-events', homeId, focusedEntityType, focusedEntityId],
    enabled: Boolean(homeId),
    queryFn: async (): Promise<ActivityEvent[]> => {
      let query = createClient()
        .from('activity_events')
        .select('id, entity_type, entity_id, action, actor_id, before_data, after_data, created_at')
        .eq('home_id', homeId!)
        .order('created_at', { ascending: false })
        .limit(150)

      if (focusedEntityId) {
        query = query.eq('entity_id', focusedEntityId)
      }

      const { data, error } = await query
      if (error) {
        throw error
      }

      return (data ?? []).map((event) => ({
        id: event.id,
        entityType: event.entity_type as ActivityEntityType,
        entityId: event.entity_id,
        action: event.action as ActivityAction,
        actorId: event.actor_id,
        beforeData: event.before_data as Record<string, unknown> | null,
        afterData: event.after_data as Record<string, unknown> | null,
        createdAt: event.created_at,
      }))
    },
  })

  const events = activityQuery.data ?? []
  const visibleEvents = useMemo(
    () => filter === 'all' ? events : events.filter((event) => event.entityType === filter),
    [events, filter],
  )
  const memberNames = useMemo(
    () => new Map(members.map((member) => [member.userId, member.displayName])),
    [members],
  )
  const title = focusedEntityType === 'item'
    ? '물건 기록'
    : focusedEntityType === 'location'
      ? '공간 기록'
      : focusedEntityType === 'structure'
        ? '구조물 기록'
        : '공동체 전체 기록'

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-extrabold text-slate-900"><History size={18} className="text-violet-700" /> {title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">최근 150건을 최신순으로 보여 줍니다. 과거 위치와 이름은 당시 값으로 남습니다.</p>
        </div>
        {!focusedEntityId && (
          <div className="flex flex-wrap gap-1.5" aria-label="기록 종류 필터">
            <FilterButton label="전체" selected={filter === 'all'} onClick={() => setFilter('all')} />
            <FilterButton label="물건" selected={filter === 'item'} onClick={() => setFilter('item')} />
            <FilterButton label="공간" selected={filter === 'location'} onClick={() => setFilter('location')} />
            <FilterButton label="구조물" selected={filter === 'structure'} onClick={() => setFilter('structure')} />
          </div>
        )}
      </div>

      {activityQuery.isLoading ? (
        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">기록을 불러오는 중입니다.</p>
      ) : activityQuery.error ? (
        <p role="alert" className="mt-5 rounded-2xl bg-rose-50 px-4 py-5 text-sm font-bold text-rose-700">기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : visibleEvents.length === 0 ? (
        <div className="mt-5 grid place-items-center rounded-2xl bg-slate-50 px-4 py-10 text-center">
          <History size={25} className="text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-700">아직 남은 기록이 없습니다.</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">이제부터 물건, 공간, 3D 구조물을 바꾸면 여기에 기록됩니다.</p>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {visibleEvents.map((event) => {
            const description = describeActivity(event)
            const actor = event.actorId ? memberNames.get(event.actorId) ?? '구성원' : '시스템'

            return (
              <li key={event.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${description.tone}`}>
                  <description.Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-6 text-slate-900">{description.text}</p>
                  {description.detail && <p className="mt-0.5 text-xs leading-5 text-slate-500">{description.detail}</p>}
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(event.createdAt)} · {actor}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function FilterButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${selected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700'}`}>
      {label}
    </button>
  )
}

function describeActivity(event: ActivityEvent) {
  const before = event.beforeData ?? {}
  const after = event.afterData ?? {}

  if (event.entityType === 'item') {
    const name = readString(after, 'title') ?? readString(before, 'title') ?? '물건'
    const beforePath = readPath(before)
    const afterPath = readPath(after)

    if (event.action === 'moved') {
      return { Icon: Package, tone: 'bg-sky-100 text-sky-700', text: `${name}을(를) 옮겼습니다.`, detail: `${beforePath ?? '이전 공간'} → ${afterPath ?? '새 공간'}` }
    }
    if (event.action === 'deleted') {
      return { Icon: Package, tone: 'bg-rose-100 text-rose-700', text: `${name}을(를) 휴지통으로 보냈습니다.`, detail: beforePath ?? undefined }
    }
    if (event.action === 'restored') {
      return { Icon: Package, tone: 'bg-emerald-100 text-emerald-700', text: `${name}을(를) 복원했습니다.`, detail: afterPath ?? undefined }
    }
    if (event.action === 'created') {
      return { Icon: Package, tone: 'bg-sky-100 text-sky-700', text: `${name}을(를) 등록했습니다.`, detail: afterPath ?? undefined }
    }
    return { Icon: Package, tone: 'bg-slate-100 text-slate-700', text: `${name} 정보를 수정했습니다.`, detail: afterPath ?? undefined }
  }

  if (event.entityType === 'structure') {
    const name = readString(after, 'name') ?? readString(before, 'name') ?? '구조물'
    const kind = readString(after, 'kind') ?? readString(before, 'kind')
    const label = kind === 'window' ? '창문' : '벽'
    const place = readLayoutPath(after) ?? readLayoutPath(before)
    const action = event.action === 'created' ? '등록했습니다.' : event.action === 'deleted' ? '삭제했습니다.' : '수정했습니다.'
    return { Icon: Construction, tone: kind === 'window' ? 'bg-sky-100 text-sky-700' : 'bg-stone-100 text-stone-700', text: `${label} “${name}”을(를) ${action}`, detail: place }
  }

  if (event.entityType === 'layout') {
    const place = readLocationPathFromLayout(after) ?? readLocationPathFromLayout(before) ?? '우리 집'
    return { Icon: Ruler, tone: 'bg-violet-100 text-violet-700', text: `${place}의 3D 크기를 수정했습니다.`, detail: formatDimensions(before, after) }
  }

  const name = readString(after, 'name') ?? readString(before, 'name') ?? '공간'
  const isPlacement = hasCoordinate(after) || hasCoordinate(before)
  if (isPlacement) {
    const action = event.action === 'created' ? '3D 자리를 정했습니다.' : event.action === 'deleted' ? '3D 자리를 해제했습니다.' : '3D 배치를 수정했습니다.'
    return { Icon: MapPinned, tone: 'bg-violet-100 text-violet-700', text: `${name}의 ${action}`, detail: formatCoordinates(after) ?? formatCoordinates(before) }
  }
  if (event.action === 'created') return { Icon: Box, tone: 'bg-violet-100 text-violet-700', text: `공간 “${name}”을(를) 등록했습니다.`, detail: readPath(after) ?? undefined }
  if (event.action === 'deleted') return { Icon: Box, tone: 'bg-rose-100 text-rose-700', text: `공간 “${name}”을(를) 삭제했습니다.`, detail: readPath(before) ?? undefined }
  if (event.action === 'moved') return { Icon: Box, tone: 'bg-violet-100 text-violet-700', text: `공간 “${name}”을(를) 옮겼습니다.`, detail: `${readPath(before) ?? '이전 공간'} → ${readPath(after) ?? '새 공간'}` }
  return { Icon: Box, tone: 'bg-slate-100 text-slate-700', text: `공간 “${name}” 정보를 수정했습니다.`, detail: readPath(after) ?? undefined }
}

function readString(value: Record<string, unknown>, key: string) {
  const candidate = value[key]
  return typeof candidate === 'string' && candidate ? candidate : null
}

function readPath(value: Record<string, unknown>) {
  const location = value.location
  return location && typeof location === 'object' && 'path' in location && typeof location.path === 'string'
    ? location.path
    : null
}

function readLayoutPath(value: Record<string, unknown>) {
  const layout = value.layout
  return layout && typeof layout === 'object' && 'location' in layout && layout.location && typeof layout.location === 'object' && 'path' in layout.location && typeof layout.location.path === 'string'
    ? layout.location.path
    : null
}

function readLocationPathFromLayout(value: Record<string, unknown>) {
  const location = value.location
  return location && typeof location === 'object' && 'path' in location && typeof location.path === 'string'
    ? location.path
    : null
}

function hasCoordinate(value: Record<string, unknown>) {
  return typeof value.xCm === 'number'
}

function formatCoordinates(value: Record<string, unknown>) {
  if (!hasCoordinate(value)) return null
  return `좌표 X ${value.xCm}cm · Y ${value.zCm}cm · 가로 ${value.widthCm}cm · 세로 ${value.depthCm}cm`
}

function formatDimensions(before: Record<string, unknown>, after: Record<string, unknown>) {
  if (typeof after.widthCm !== 'number') return null
  const beforeText = typeof before.widthCm === 'number' ? `가로 ${before.widthCm}cm · 세로 ${before.depthCm}cm` : null
  const afterText = `가로 ${after.widthCm}cm · 세로 ${after.depthCm}cm`
  return beforeText ? `${beforeText} → ${afterText}` : afterText
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
