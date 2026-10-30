import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { QueryClient } from '@tanstack/react-query'

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
