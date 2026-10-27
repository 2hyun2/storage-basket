'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { CloudUpload, Database, TriangleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  getLocalItemsServerSnapshot,
  readLocalItems,
  subscribeToLocalItems,
} from '@/lib/space/local-items'
import {
  getLocalSpacesServerSnapshot,
  readLocalSpaces,
  subscribeToLocalSpaces,
  type LocalSpace,
} from '@/lib/space/local-spaces'

type ImportResult = {
  createdLocations: number
  createdItems: number
}

export function SupabaseImportCard() {
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const spaces = useSyncExternalStore(
    subscribeToLocalSpaces,
    readLocalSpaces,
    getLocalSpacesServerSnapshot,
  )
  const items = useSyncExternalStore(
    subscribeToLocalItems,
    readLocalItems,
    getLocalItemsServerSnapshot,
  )
  const orderedSpaces = useMemo(() => orderSpacesByParent(spaces), [spaces])

  async function handleImport() {
    if (orderedSpaces.length !== spaces.length) {
      setErrorMessage('공간 계층에 순환 또는 누락된 부모가 있어 가져올 수 없습니다.')
      return
    }

    setIsImporting(true)
    setErrorMessage(null)

    const supabase = createClient()
    const { data, error } = await supabase.rpc('import_local_inventory', {
      p_locations: orderedSpaces.map((space) => ({
        localId: space.id,
        parentLocalId: space.parentId,
        name: space.name,
      })),
      p_items: items.map((item) => ({
        localId: item.id,
        locationLocalId: item.locationId,
        title: item.title,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        note: item.note,
      })),
    })

    setIsImporting(false)

    if (error) {
      setErrorMessage('가져오지 못했습니다. Supabase migration을 실행했는지 확인해 주세요.')
      return
    }

    setResult({
      createdLocations: Number(data?.createdLocations ?? 0),
      createdItems: Number(data?.createdItems ?? 0),
    })
  }

  return (
    <section className="mt-6 rounded-3xl border border-sky-200 bg-sky-50 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-600 text-white">
          <Database size={18} />
        </span>
        <div>
          <h2 className="font-extrabold text-sky-950">Supabase로 현재 데이터 가져오기</h2>
          <p className="mt-1 text-sm leading-6 text-sky-800">
            이 브라우저의 공간 {spaces.length}곳과 물건 {items.length}종을 로그인한 개인 Home에 저장합니다.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-sky-200 bg-white/80 px-3 py-2 text-xs leading-5 text-sky-900">
        <TriangleAlert size={15} className="mt-0.5 shrink-0" />
        <p>가져오기 전에는 SQL migration을 먼저 실행해야 합니다. 같은 임시 데이터는 다시 가져와도 중복 생성하지 않습니다.</p>
      </div>

      {result && (
        <p className="mt-4 rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
          완료: 새 공간 {result.createdLocations}곳, 새 물건 {result.createdItems}종을 저장했습니다.
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="mt-4 rounded-2xl bg-rose-100 px-3 py-2 text-sm font-bold text-rose-800">
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        disabled={isImporting || (spaces.length === 0 && items.length === 0)}
        onClick={handleImport}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CloudUpload size={16} />
        {isImporting ? '가져오는 중…' : 'Supabase에 저장'}
      </button>
    </section>
  )
}

function orderSpacesByParent(spaces: LocalSpace[]) {
  const orderedSpaces: LocalSpace[] = []
  const pendingSpaces = [...spaces]
  const knownIds = new Set<string>()

  while (pendingSpaces.length > 0) {
    const nextIndex = pendingSpaces.findIndex(
      (space) => space.parentId === null || knownIds.has(space.parentId),
    )

    if (nextIndex === -1) {
      break
    }

    const [nextSpace] = pendingSpaces.splice(nextIndex, 1)

    if (!nextSpace) {
      break
    }

    orderedSpaces.push(nextSpace)
    knownIds.add(nextSpace.id)
  }

  return orderedSpaces
}
