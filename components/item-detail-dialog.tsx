'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock3, History, MapPinned, Package, Pencil, X } from 'lucide-react'
import type { LocalItem } from '@/lib/space/local-items'
import type { LocalSpace } from '@/lib/space/local-spaces'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseInventory } from '@/lib/space/use-supabase-inventory'

type ItemActivityPreview = {
  id: string
  action: 'created' | 'updated' | 'moved' | 'deleted' | 'restored'
  beforeData: Record<string, unknown> | null
  afterData: Record<string, unknown> | null
  createdAt: string
}

export function ItemDetailDialog({
  item,
  onClose,
  onEdit,
}: {
  item: LocalItem
  onClose: () => void
  onEdit: () => void
}) {
  const { homeId, spaces } = useSupabaseInventory()
  const locationTrail = useMemo(() => getLocationTrail(item.locationId, spaces), [item.locationId, spaces])
  const activityQuery = useQuery({
    queryKey: ['item-activity-preview', homeId, item.id],
    enabled: Boolean(homeId),
    queryFn: async (): Promise<ItemActivityPreview[]> => {
      const { data, error } = await createClient()
        .from('activity_events')
        .select('id, action, before_data, after_data, created_at')
        .eq('home_id', homeId!)
        .eq('entity_type', 'item')
        .eq('entity_id', item.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) {
        throw error
      }

      return (data ?? []).map((event) => ({
        id: event.id,
        action: event.action as ItemActivityPreview['action'],
        beforeData: event.before_data as Record<string, unknown> | null,
        afterData: event.after_data as Record<string, unknown> | null,
        createdAt: event.created_at,
      }))
    },
  })

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={`${item.title} 상세 정보`}>
      <section className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700"><Package size={19} /></span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-sky-700">물건 상세</p>
              <h2 className="mt-1 truncate text-xl font-semibold text-slate-950">{item.title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="물건 상세 창 닫기"><X size={18} /></button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <InfoBlock label="수량" value={String(item.quantity)} />
          <InfoBlock label="단위" value={item.unit || '없음'} />
          <InfoBlock label="분류" value={item.category ?? '미분류'} />
        </div>

        <section className="mt-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-violet-950"><MapPinned size={16} /> 현재 보관 위치</p>
          {locationTrail.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-sm font-bold text-violet-800">
              {locationTrail.map((space, index) => (
                <span key={space.id} className="flex items-center gap-1">
                  {index > 0 && <ArrowRight size={13} className="text-violet-400" />}
                  <Link href={`/app/space/${space.id}`} className="rounded-md px-1 py-0.5 hover:bg-white hover:text-violet-950" onClick={onClose}>{space.name}</Link>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm font-bold text-rose-700">연결된 보관 공간을 찾을 수 없습니다.</p>
          )}
          {locationTrail.length > 0 && (
            <Link href={`/app/space/${item.locationId}`} onClick={onClose} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-950">
              이 공간으로 이동 <ArrowRight size={14} />
            </Link>
          )}
        </section>

        {item.note && (
          <section className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">메모</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.note}</p>
          </section>
        )}

        <section className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900"><Clock3 size={16} className="text-violet-700" /> 최근 변경 기록</p>
              <p className="mt-1 text-xs text-slate-500">위치를 옮기거나 정보를 바꾼 기록입니다.</p>
            </div>
            <Link href={`/app/archive?item=${item.id}`} onClick={onClose} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-950">
              전체 기록 <ArrowRight size={14} />
            </Link>
          </div>

          {activityQuery.isLoading ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500">기록을 불러오는 중입니다.</p>
          ) : activityQuery.error ? (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700">기록을 불러오지 못했습니다. 전체 기록에서 다시 확인해 주세요.</p>
          ) : (activityQuery.data?.length ?? 0) === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500">아직 남은 변경 기록이 없습니다.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100 px-3">
              {activityQuery.data?.map((event) => <ActivityPreviewRow key={event.id} event={event} />)}
            </ul>
          )}
        </section>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onEdit} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"><Pencil size={16} /> 수정</button>
          <Link href={`/app/archive?item=${item.id}`} onClick={onClose} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"><History size={16} /> 전체 기록 보기</Link>
        </div>
      </section>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p></div>
}

function ActivityPreviewRow({ event }: { event: ItemActivityPreview }) {
  const before = event.beforeData ?? {}
  const after = event.afterData ?? {}
  const beforePath = getSnapshotPath(before)
  const afterPath = getSnapshotPath(after)
  const content = event.action === 'moved'
    ? { title: '보관 위치를 옮겼습니다.', detail: `${beforePath ?? '이전 공간'} → ${afterPath ?? '새 공간'}` }
    : event.action === 'created'
      ? { title: '물건을 등록했습니다.', detail: afterPath }
      : event.action === 'deleted'
        ? { title: '휴지통으로 보냈습니다.', detail: beforePath }
        : event.action === 'restored'
          ? { title: '물건을 복원했습니다.', detail: afterPath }
          : { title: '물건 정보를 수정했습니다.', detail: afterPath }

  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <p className="text-sm font-bold text-slate-800">{content.title}</p>
      {content.detail && <p className="mt-0.5 truncate text-xs text-slate-500">{content.detail}</p>}
      <p className="mt-1 text-xs text-slate-400">{formatDateTime(event.createdAt)}</p>
    </li>
  )
}

function getLocationTrail(locationId: string, spaces: LocalSpace[]) {
  const spacesById = new Map(spaces.map((space) => [space.id, space]))
  const trail: LocalSpace[] = []
  let current = spacesById.get(locationId)

  while (current) {
    trail.unshift(current)
    current = current.parentId ? spacesById.get(current.parentId) : undefined
  }

  return trail
}

function getSnapshotPath(value: Record<string, unknown>) {
  const location = value.location
  return location && typeof location === 'object' && 'path' in location && typeof location.path === 'string'
    ? location.path
    : null
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
