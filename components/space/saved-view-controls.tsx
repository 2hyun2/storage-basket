'use client'

import { Html, OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { createClient } from '@/lib/supabase/client'

type View = { offset: number[]; target: number[] }
const prefix = 'storage-basket:space-view:v1:'

function readView(key: string): View | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const value = JSON.parse(raw) as View
  if (![value.offset, value.target].every((vector) => Array.isArray(vector) && vector.length === 3 && vector.every((n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 100))) return null
  return value
}

export function SavedViewControls({ center, scale, defaultPosition, enabled = true }: {
  center: [number, number, number]
  scale: number
  defaultPosition: [number, number, number]
  enabled?: boolean
}) {
  const { camera, invalidate } = useThree()
  const controls = useRef<OrbitControlsImpl>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const size = Math.max(scale, 0.1)
  const [cx, cy, cz] = center
  const [px, py, pz] = defaultPosition

  useEffect(() => {
    if (!enabled) return
    let active = true
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserId(session?.user.id ?? null)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [enabled])

  useEffect(() => {
    const orbit = controls.current
    if (!orbit || !enabled) return
    camera.position.set(px, py, pz)
    orbit.target.set(cx, cy, cz)
    if (userId) {
      try {
        const view = readView(prefix + userId)
        if (view) {
          orbit.target.set(cx + view.target[0] * size, cy + view.target[1] * size, cz + view.target[2] * size)
          camera.position.set(orbit.target.x + view.offset[0] * size, orbit.target.y + view.offset[1] * size, orbit.target.z + view.offset[2] * size)
        }
      } catch { /* 저장값이 손상되거나 접근할 수 없으면 기본 시점을 사용한다. */ }
    }
    orbit.update()
    invalidate()
  }, [camera, cx, cy, cz, enabled, invalidate, px, py, pz, size, userId])

  function act(action: 'save' | 'restore' | 'reset') {
    const orbit = controls.current
    if (!userId || !orbit) return
    const key = prefix + userId
    try {
      if (action === 'save') {
        const view: View = {
          target: [(orbit.target.x - cx) / size, (orbit.target.y - cy) / size, (orbit.target.z - cz) / size],
          offset: [(camera.position.x - orbit.target.x) / size, (camera.position.y - orbit.target.y) / size, (camera.position.z - orbit.target.z) / size],
        }
        localStorage.setItem(key, JSON.stringify(view))
        setMessage('이 계정의 시점을 이 브라우저에 저장했습니다.')
      } else if (action === 'restore') {
        const view = readView(key)
        if (!view) { setMessage('먼저 현재 시점을 저장해 주세요.'); return }
        orbit.target.set(cx + view.target[0] * size, cy + view.target[1] * size, cz + view.target[2] * size)
        camera.position.set(orbit.target.x + view.offset[0] * size, orbit.target.y + view.offset[1] * size, orbit.target.z + view.offset[2] * size)
        setMessage('저장한 시점으로 돌아왔습니다.')
      } else {
        localStorage.removeItem(key)
        orbit.target.set(cx, cy, cz)
        camera.position.set(px, py, pz)
        setMessage('저장한 시점을 지우고 기본 시점으로 초기화했습니다.')
      }
      orbit.update()
      invalidate()
    } catch {
      setMessage('브라우저 저장소를 사용할 수 없습니다. 사이트 저장 설정을 확인해 주세요.')
    }
  }

  return (
    <>
      <OrbitControls ref={controls} target={center} enablePan={false} minDistance={size * 0.2} maxDistance={size * 6} minPolarAngle={0.08} maxPolarAngle={Math.PI / 2 - 0.08} />
      {enabled && userId && (
        <Html fullscreen position={center} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-1">
            {([
              ['save', '현재 시점 저장'],
              ['restore', '저장한 시점으로 복귀'],
              ['reset', '기본 시점 초기화'],
            ] as const).map(([action, label]) => <button key={action} type="button" onClick={(event) => { event.stopPropagation(); act(action) }} className="pointer-events-auto rounded-lg border border-slate-200 bg-white/95 px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-blue-50">{label}</button>)}
            {message && <p role="status" className="w-full rounded-lg bg-white/95 px-2 py-1 text-xs text-slate-600">{message}</p>}
          </div>
        </Html>
      )}
    </>
  )
}
