export const spaceColorPalette = [
  '#8B5CF6',
  '#0EA5E9',
  '#EC4899',
  '#F59E0B',
  '#14B8A6',
  '#6366F1',
] as const

export function getDefaultSpaceColor(index = 0) {
  return spaceColorPalette[index % spaceColorPalette.length]
}

export function normalizeSpaceColor(value: string) {
  const normalized = value.trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null
}
