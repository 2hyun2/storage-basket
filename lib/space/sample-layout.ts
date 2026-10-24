import { validateLayout } from '@/lib/space/geometry'
import type { SpaceLayout } from '@/lib/space/types'

const homeLayout: SpaceLayout = {
  id: 'home',
  locationName: '우리 집',
  viewMode: 'plan',
  grid: { width: 100, height: 60 },
  nodes: [
    {
      id: 'living-room',
      name: '거실',
      kind: 'room',
      color: '#8b5cf6',
      rect: { x: 4, y: 5, width: 52, height: 32 },
      itemCount: 18,
      drillable: true,
    },
    {
      id: 'kitchen',
      name: '부엌',
      kind: 'room',
      color: '#f97316',
      rect: { x: 60, y: 5, width: 34, height: 24 },
      itemCount: 12,
    },
    {
      id: 'bedroom',
      name: '안방',
      kind: 'room',
      color: '#0ea5e9',
      rect: { x: 60, y: 33, width: 34, height: 22 },
      itemCount: 26,
    },
    {
      id: 'hallway',
      name: '통로',
      kind: 'room',
      color: '#64748b',
      rect: { x: 4, y: 41, width: 52, height: 14 },
    },
  ],
}

const livingRoomLayout: SpaceLayout = {
  id: 'living-room',
  locationName: '거실',
  viewMode: 'plan',
  grid: { width: 100, height: 60 },
  nodes: [
    {
      id: 'tv-cabinet',
      name: 'TV장',
      kind: 'cabinet',
      color: '#8b5cf6',
      rect: { x: 5, y: 7, width: 38, height: 16 },
      itemCount: 9,
      drillable: true,
    },
    {
      id: 'living-storage',
      name: '거실 수납장',
      kind: 'cabinet',
      color: '#6366f1',
      rect: { x: 57, y: 7, width: 34, height: 16 },
      itemCount: 7,
    },
    {
      id: 'sofa-box',
      name: '소파 옆 상자',
      kind: 'box',
      color: '#a855f7',
      rect: { x: 57, y: 34, width: 22, height: 18 },
      itemCount: 2,
    },
  ],
}

const tvCabinetLayout: SpaceLayout = {
  id: 'tv-cabinet',
  locationName: 'TV장',
  viewMode: 'storage',
  grid: { width: 100, height: 60 },
  nodes: [
    {
      id: 'left-drawer',
      name: '왼쪽 서랍',
      kind: 'drawer',
      color: '#7c3aed',
      rect: { x: 5, y: 8, width: 42, height: 44 },
      itemCount: 4,
    },
    {
      id: 'right-drawer',
      name: '오른쪽 서랍',
      kind: 'drawer',
      color: '#6d28d9',
      rect: { x: 53, y: 8, width: 42, height: 44 },
      itemCount: 5,
      drillable: true,
    },
  ],
}

const rightDrawerLayout: SpaceLayout = {
  id: 'right-drawer',
  locationName: '오른쪽 서랍',
  viewMode: 'storage',
  grid: { width: 100, height: 60 },
  nodes: [
    {
      id: 'battery-box',
      name: '건전지 상자',
      kind: 'box',
      color: '#eab308',
      rect: { x: 6, y: 8, width: 38, height: 42 },
      itemCount: 8,
    },
    {
      id: 'cable-pouch',
      name: '충전 케이블 파우치',
      kind: 'box',
      color: '#14b8a6',
      rect: { x: 52, y: 8, width: 42, height: 42 },
      itemCount: 3,
    },
  ],
}

const layouts = [homeLayout, livingRoomLayout, tvCabinetLayout, rightDrawerLayout]

export const sampleLayouts = new Map(
  layouts.map((layout) => [layout.id, validateLayout(layout)]),
)

export const sampleParents: Record<string, string | null> = {
  home: null,
  'living-room': 'home',
  'tv-cabinet': 'living-room',
  'right-drawer': 'tv-cabinet',
}

export function getSampleLayout(locationId?: string) {
  return sampleLayouts.get(locationId ?? 'home') ?? sampleLayouts.get('home')!
}
