import { Router } from 'express'
import { z } from 'zod'
import { supabase } from './supabase.js'

export const locationsRouter = Router()
const inputSchema = z.object({ name: z.string().trim().min(1).max(100), parentId: z.string().uuid().nullable() })
const deleteSchema = z.object({ itemDestinationIds: z.record(z.string(), z.string().uuid()).default({}) })

const mapLocation = (row: Record<string, unknown>) => ({
  id: row.id, name: row.name, parentId: row.parent_id,
  createdAt: row.created_at, createdBy: row.created_by,
  updatedAt: row.updated_at, updatedBy: row.updated_by,
})

locationsRouter.get('/', async (_request, response, next) => {
  try {
    const { data, error } = await supabase.from('locations').select('*').order('created_at')
    if (error) throw error
    response.json(data.map(mapLocation))
  } catch (error) { next(error) }
})

locationsRouter.post('/', async (request, response, next) => {
  try {
    const parsed = inputSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: { message: '위치 입력값이 올바르지 않아요.' } })
    if (parsed.data.parentId && !(await locationExists(parsed.data.parentId))) return response.status(400).json({ error: { message: '상위 위치를 찾을 수 없어요.' } })
    const { data, error } = await supabase.from('locations').insert({ name: parsed.data.name, parent_id: parsed.data.parentId }).select().single()
    if (error) throw error
    response.status(201).json(mapLocation(data))
  } catch (error) { next(error) }
})

locationsRouter.patch('/:id', async (request, response, next) => {
  try {
    const parsed = inputSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: { message: '위치 입력값이 올바르지 않아요.' } })
    const { data: all, error: readError } = await supabase.from('locations').select('id,parent_id')
    if (readError) throw readError
    if (!all.some((row) => row.id === request.params.id)) return response.status(404).json({ error: { message: '위치를 찾을 수 없어요.' } })
    if (parsed.data.parentId && (!all.some((row) => row.id === parsed.data.parentId) || descendantIds(request.params.id, all).has(parsed.data.parentId))) return response.status(400).json({ error: { message: '자신 또는 하위 위치 아래로 옮길 수 없어요.' } })
    const { data, error } = await supabase.from('locations').update({ name: parsed.data.name, parent_id: parsed.data.parentId, updated_at: new Date().toISOString(), updated_by: 'local-user' }).eq('id', request.params.id).select().single()
    if (error) throw error
    response.json(mapLocation(data))
  } catch (error) { next(error) }
})

locationsRouter.delete('/:id', async (request, response, next) => {
  try {
    const parsed = deleteSchema.safeParse(request.body ?? {})
    if (!parsed.success) return response.status(400).json({ error: { message: '물건 이동 정보가 올바르지 않아요.' } })
    const { count: childCount, error: childError } = await supabase.from('locations').select('*', { count: 'exact', head: true }).eq('parent_id', request.params.id)
    if (childError) throw childError
    if (childCount) return response.status(409).json({ error: { message: '하위 위치가 있어 삭제할 수 없어요.' } })
    const { data: items, error: itemError } = await supabase.from('items').select('id').eq('location_id', request.params.id)
    if (itemError) throw itemError
    for (const item of items) {
      const destinationId = parsed.data.itemDestinationIds[item.id]
      if (!destinationId || destinationId === request.params.id || !(await locationExists(destinationId))) return response.status(400).json({ error: { message: '모든 물건의 새 위치를 선택하세요.' } })
      const { error } = await supabase.from('items').update({ location_id: destinationId, updated_at: new Date().toISOString(), updated_by: 'local-user' }).eq('id', item.id)
      if (error) throw error
    }
    const { error } = await supabase.from('locations').delete().eq('id', request.params.id)
    if (error) throw error
    response.status(204).send()
  } catch (error) { next(error) }
})

const locationExists = async (id: string) => {
  const { data, error } = await supabase.from('locations').select('id').eq('id', id).maybeSingle()
  if (error) throw error
  return Boolean(data)
}

const descendantIds = (id: string, rows: Array<{ id: string; parent_id: string | null }>) => {
  const ids = new Set([id]); const pending = [id]
  while (pending.length) {
    const parentId = pending.pop()
    for (const row of rows.filter((entry) => entry.parent_id === parentId)) { ids.add(row.id); pending.push(row.id) }
  }
  return ids
}
