import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../lib/space/plan-gestures.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const loaded = { exports: {} }
new Function('exports', compiled)(loaded.exports)
const { dragPlanRectangle } = loaded.exports

const base = {
  original: { x: 50, y: 50, width: 75, depth: 30 },
  start: { x: 80, y: 60 },
  bounds: { width: 398, depth: 250 },
  siblings: [],
  tolerance: { x: 5, y: 5 },
}

test('영역 이동은 크기를 유지하고 10cm 격자와 부모 범위를 적용', () => {
  const { rectangle } = dragPlanRectangle({ ...base, mode: 'move', point: { x: 96, y: 73 } })
  assert.deepEqual(rectangle, { x: 70, y: 60, width: 75, depth: 30 })
  const outside = dragPlanRectangle({ ...base, mode: 'move', point: { x: -500, y: 900 } })
  assert.deepEqual(outside.rectangle, { x: 0, y: 220, width: 75, depth: 30 })
})

test('10cm 배수가 아닌 부모 벽에도 정확히 붙임', () => {
  const result = dragPlanRectangle({ ...base, mode: 'move', point: { x: 351, y: 60 } })
  assert.equal(result.rectangle.x, 323)
  assert.equal(result.rectangle.x + result.rectangle.width, 398)
  assert.equal(result.guides.x, 398)
})

test('형제 벽·공간의 양쪽 경계에 붙이며 떨어진 다른 줄은 무시', () => {
  const siblings = [{ x: 163, y: 0, width: 15, depth: 150 }]
  const left = dragPlanRectangle({ ...base, mode: 'move', siblings, point: { x: 116, y: 60 } })
  assert.equal(left.rectangle.x + left.rectangle.width, 163)
  const right = dragPlanRectangle({ ...base, mode: 'move', siblings, point: { x: 207, y: 60 } })
  assert.equal(right.rectangle.x, 178)
  const far = dragPlanRectangle({ ...base, mode: 'move', siblings: [{ ...siblings[0], y: 200 }], point: { x: 116, y: 60 } })
  assert.equal(far.rectangle.x, 90)
  assert.equal(far.guides.x, undefined)
})

test('네 모서리 크기 조절은 반대쪽 모서리를 고정', () => {
  for (const mode of ['nw', 'ne', 'sw', 'se']) {
    const result = dragPlanRectangle({ ...base, mode, point: { x: 100, y: 80 } }).rectangle
    if (mode.includes('w')) assert.equal(result.x + result.width, 125)
    else assert.equal(result.x, 50)
    if (mode.includes('n')) assert.equal(result.y + result.depth, 80)
    else assert.equal(result.y, 50)
    assert.ok(result.width >= 1 && result.depth >= 1)
  }
})

test('크기 조절도 벽 경계에 붙고 부모 밖으로 나가지 않음', () => {
  const right = dragPlanRectangle({ ...base, mode: 'se',
    siblings: [{ x: 163, y: 0, width: 15, depth: 150 }], point: { x: 117, y: 60 },
  })
  assert.equal(right.rectangle.x + right.rectangle.width, 163)
  const outside = dragPlanRectangle({ ...base, mode: 'se', point: { x: 900, y: 900 } }).rectangle
  assert.equal(outside.x + outside.width, 398)
  assert.equal(outside.y + outside.depth, 250)
})

test('반대 모서리를 넘겨도 음수 크기가 되지 않으며 역방향 새 그리기도 지원', () => {
  const crossed = dragPlanRectangle({ ...base, mode: 'nw', point: { x: 900, y: 900 } }).rectangle
  assert.ok(crossed.width >= 1 && crossed.depth >= 1)
  const reverse = dragPlanRectangle({ ...base, mode: 'draw', start: { x: 180, y: 160 }, point: { x: 25, y: 43 } }).rectangle
  assert.deepEqual(reverse, { x: 30, y: 40, width: 150, depth: 120 })
})
