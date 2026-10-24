export type SpaceViewMode = 'plan' | 'storage'

export type GridRect = {
  x: number
  y: number
  width: number
  height: number
}

export type SpaceNode = {
  id: string
  name: string
  kind: 'room' | 'cabinet' | 'drawer' | 'box'
  color: string
  rect: GridRect
  itemCount?: number
  drillable?: boolean
}

export type SpaceLayout = {
  id: string
  locationName: string
  viewMode: SpaceViewMode
  grid: {
    width: number
    height: number
  }
  nodes: SpaceNode[]
}
