import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { QueryClient } from '@tanstack/react-query'
import { Box3, BoxGeometry, Mesh, PerspectiveCamera, Vector3 } from 'three'

// 순수 TypeScript 유틸을 별도 빌드 산출물 없이 테스트한다.
function load(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const loaded = { exports: {} }
  new Function('module', 'exports', 'require', compiled)(loaded, loaded.exports, createRequire(import.meta.url))
  return loaded.exports
}

const { sessionCookieOptions } = load('../lib/auth/session.ts')
const { readAllPages, cachedRows } = load('../lib/space/paged-query.ts')
const { invalidateHomeInventory } = load('../lib/space/query-cache.ts')
const { toSceneCenter, getSpacePreviewFrame } = load('../lib/space/scene-coordinates.ts')
const { applyPlanEdit, fitPlacementPosition, getPlacementSizeError } = load('../lib/space/placement-workflow.ts')

test('높은 부모 공간도 미리보기의 여덟 꼭짓점이 시야 안에 들어옴', () => {
  for (const bounds of [
    { widthCm: 200, depthCm: 100, heightCm: 250 },
    { widthCm: 30, depthCm: 20, heightCm: 500 },
  ]) {
    for (const fov of [42, 45]) {
      const frame = getSpacePreviewFrame(bounds, fov)
      const camera = new PerspectiveCamera(fov, 1, 0.01, 100)
      camera.position.set(...frame.position)
      camera.lookAt(...frame.target)
      camera.updateMatrixWorld()
      for (const x of [0, bounds.widthCm / 100]) {
        for (const y of [0, bounds.heightCm / 100]) {
          for (const z of [0, bounds.depthCm / 100]) {
            const vertex = new Vector3(x, y, z).project(camera)
            assert.ok(Math.abs(vertex.x) < 1 && Math.abs(vertex.y) < 1)
          }
        }
      }
    }
  }
})

test('크기 단계에서 이동 입력이 들어와도 기존 좌표를 유지하고 배치 단계에서는 크기를 유지', () => {
  const current = { x: 50, y: 69, width: 75, depth: 30 }
  const next = { x: 100, y: 120, width: 90, depth: 60 }
  assert.deepEqual(applyPlanEdit('size', current, next), { x: 50, y: 69, width: 90, depth: 60 })
  assert.deepEqual(applyPlanEdit('position', current, next), { x: 100, y: 120, width: 75, depth: 30 })
})

test('크기 확인은 좌표 0과 별개로 검증하며 부모보다 큰 치수와 소수는 다음 단계로 넘기지 않음', () => {
  const bounds = { widthCm: 200, depthCm: 100, heightCm: 250 }
  assert.equal(getPlacementSizeError({ x: 0, y: 0, z: 0, width: 75, depth: 30, height: 80 }, bounds), null)
  for (const size of [
    { width: 201, depth: 30, height: 80 }, { width: 75, depth: 101, height: 80 },
    { width: 75, depth: 30, height: 251 }, { width: 0, depth: 30, height: 80 },
    { width: 75.5, depth: 30, height: 80 },
  ]) assert.ok(getPlacementSizeError(size, bounds))
})

test('크기 변경 후 단계 전환은 유효한 위치를 유지하고 범위를 벗어난 좌표만 보정', () => {
  const bounds = { widthCm: 200, depthCm: 100, heightCm: 250 }
  const size = { width: 75, depth: 30, height: 80 }
  assert.deepEqual(fitPlacementPosition({ x: 50, y: 69, z: 60 }, size, bounds), { x: 50, y: 69, z: 60 })
  assert.deepEqual(fitPlacementPosition({ x: 180, y: 90, z: 230 }, size, bounds), { x: 125, y: 70, z: 170 })
  assert.deepEqual(size, { width: 75, depth: 30, height: 80 })
})

test('배치 미리보기: 바닥에서 60cm, 자체 높이 80cm이면 실제 박스는 60~140cm', () => {
  const geometry = new BoxGeometry(0.75, 0.8, 0.3)
  const mesh = new Mesh(geometry)
  try {
    // 기존 자체 높이가 50cm였던 객체를 80cm로 바꾸어도 그 50cm를 더하지 않는다.
    for (const heightCm of [50, 80]) {
      mesh.geometry.dispose()
      mesh.geometry = new BoxGeometry(0.75, heightCm / 100, 0.3)
      mesh.position.set(...toSceneCenter({
        xCm: 50, elevationCm: 60, planYCm: 69,
        widthCm: 75, heightCm, depthCm: 30,
      }))
      const box = new Box3().setFromObject(mesh)
      assert.ok(Math.abs(box.min.y * 100 - 60) < 0.001)
      assert.ok(Math.abs(box.max.y * 100 - (60 + heightCm)) < 0.001)
      assert.ok(box.max.y < 2.5)
    }
  } finally {
    mesh.geometry.dispose()
    mesh.material.dispose()
  }
})

test('자동 로그인 해제 시 갱신 쿠키는 세션만, 삭제 쿠키는 만료 유지', () => {
  const options = { path: '/', maxAge: 400 * 86400, expires: new Date('2099-01-01') }
  assert.deepEqual(sessionCookieOptions(options, false), { path: '/' })
  assert.deepEqual(sessionCookieOptions(options, true), options)
  assert.equal(options.maxAge, 400 * 86400)
  assert.equal(sessionCookieOptions({ maxAge: 0 }, false).maxAge, 0)
  assert.equal(sessionCookieOptions({ expires: new Date(0) }, false).expires.getTime(), 0)
})

test('서버 행 제한이 요청 페이지보다 작아도 누락 없이 읽음', async () => {
  const source = Array.from({ length: 1007 }, (_, id) => ({ id }))
  const rows = await readAllPages(async (from, to) => ({
    data: source.slice(from, Math.min(to + 1, from + 73)), error: null,
  }))
  assert.deepEqual(rows, source)
  await assert.rejects(readAllPages(async () => ({ data: null, error: { message: '실패' } })))
})

test('물건 수정은 공간 캐시를 보존하고 전체·물건 기록을 갱신 대상으로 표시', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  try {
    for (const key of [
      ['inventory-table', 'items', 'home'], ['inventory-table', 'locations', 'home'],
      ['home-inventory'], ['activity-events', 'home'], ['item-activity-preview', 'home', 'item'],
    ]) client.setQueryData(key, ['cached'])
    await invalidateHomeInventory(client, ['items'])
    assert.equal(client.getQueryState(['inventory-table', 'locations', 'home']).isInvalidated, false)
    for (const key of [
      ['inventory-table', 'items', 'home'], ['home-inventory'],
      ['activity-events', 'home'], ['item-activity-preview', 'home', 'item'],
    ]) assert.equal(client.getQueryState(key).isInvalidated, true)
  } finally { client.clear() }
})

test('같은 공동체 조회 재사용, 다른 공동체 캐시 분리', async () => {
  const client = new QueryClient()
  let reads = 0
  const page = async (from) => { reads++; return { data: from ? [] : [{ id: 'one' }], error: null } }
  try {
    await cachedRows(client, 'items', 'home-a', page)
    const initial = reads
    await cachedRows(client, 'items', 'home-a', page)
    assert.equal(reads, initial)
    await cachedRows(client, 'items', 'home-b', page)
    assert.ok(reads > initial)
  } finally { client.clear() }
})

test('계정 전환으로 취소된 조회는 다음 페이지를 계속 요청하지 않음', async () => {
  const controller = new AbortController()
  let calls = 0
  await assert.rejects(readAllPages(async () => {
    calls++
    controller.abort()
    return { data: [{ id: 'old-account' }], error: null }
  }, controller.signal))
  assert.equal(calls, 1)
})
