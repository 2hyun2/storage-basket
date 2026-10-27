'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { Box, Layers3 } from 'lucide-react'
import {
  getLocalSpacesServerSnapshot,
  readLocalSpaces,
  subscribeToLocalSpaces,
} from '@/lib/space/local-spaces'

export function LocalSpaceList() {
  const spaces = useSyncExternalStore(
    subscribeToLocalSpaces,
    readLocalSpaces,
    getLocalSpacesServerSnapshot,
  )

  const spacesById = useMemo(
    () => new Map(spaces.map((space) => [space.id, space])),
    [spaces],
  )

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700">
          <Layers3 size={18} />
        </span>
        <div>
          <h2 className="font-extrabold text-slate-900">이 브라우저에 만든 공간</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            현재는 localStorage 임시 저장입니다. Supabase 연결 전까지 이 브라우저에서만 유지됩니다.
          </p>
        </div>
      </div>

      {spaces.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
          아직 만든 공간이 없습니다. 먼저 우리 집 아래에 거실처럼 첫 공간을 등록해 보세요.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {spaces.map((space) => {
            const parentName = space.parentId ? spacesById.get(space.parentId)?.name ?? '알 수 없는 공간' : '우리 집'

            return (
              <li key={space.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-violet-700 shadow-sm">
                    <Box size={16} />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm text-slate-900">{space.name}</strong>
                    <span className="block truncate text-xs text-slate-500">들어 있는 곳: {parentName}</span>
                  </span>
                </span>
                <span className="shrink-0 text-xs font-bold text-violet-700">
                  {space.mode === 'map' ? '지도 배치' : '간편 등록'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
