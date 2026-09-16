import { Router } from 'express'
import { z } from 'zod'
import { supabase } from './supabase.js'

export const itemsRouter = Router()
const inputSchema = z.object({
  title: z.string().trim().min(1).max(100), locationId: z.string().uuid(), quantity: z.number().int().positive(),
  options: z.object({ unit: z.string().trim().min(1).max(20), category: z.string().trim().max(30), tags: z.array(z.string().trim().min(1).max(30)).max(10), note: z.string().trim().max(1000) }),
})
const mapItem = (row: Record<string, unknown>) => ({
  id: row.id, title: row.title, locationId: row.location_id, quantity: row.quantity,
  options: { unit: row.unit, category: row.category, tags: row.tags, note: row.note },
  createdAt: row.created_at, createdBy: row.created_by, updatedAt: row.updated_at, updatedBy: row.updated_by,
})
const toRow = (value: z.infer<typeof inputSchema>) => ({ title: value.title, location_id: value.locationId, quantity: value.quantity, unit: value.options.unit, category: value.options.category, tags: value.options.tags, note: value.options.note, updated_at: new Date().toISOString(), updated_by: 'local-user' })

itemsRouter.get('/', async (_request, response, next) => {
  try { const { data, error } = await supabase.from('items').select('*').order('updated_at', { ascending: false }); if (error) throw error; response.json(data.map(mapItem)) }
  catch (error) { next(error) }
})

itemsRouter.post('/', async (request, response, next) => {
  try {
    const parsed = inputSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: { message: '물건 입력값이 올바르지 않아요.' } })
    if (!(await locationExists(parsed.data.locationId))) return response.status(400).json({ error: { message: '보관 위치를 찾을 수 없어요.' } })
    const { data, error } = await supabase.from('items').insert(toRow(parsed.data)).select().single(); if (error) throw error
    response.status(201).json(mapItem(data))
  } catch (error) { next(error) }
})

itemsRouter.patch('/:id', async (request, response, next) => {
  try {
    const parsed = inputSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: { message: '물건 입력값이 올바르지 않아요.' } })
    if (!(await locationExists(parsed.data.locationId))) return response.status(400).json({ error: { message: '보관 위치를 찾을 수 없어요.' } })
    const { data, error } = await supabase.from('items').update(toRow(parsed.data)).eq('id', request.params.id).select().maybeSingle(); if (error) throw error
    if (!data) return response.status(404).json({ error: { message: '물건을 찾을 수 없어요.' } })
    response.json(mapItem(data))
  } catch (error) { next(error) }
})

itemsRouter.delete('/:id', async (request, response, next) => {
  try { const { error } = await supabase.from('items').delete().eq('id', request.params.id); if (error) throw error; response.status(204).send() }
  catch (error) { next(error) }
})

const locationExists = async (id: string) => {
  const { data, error } = await supabase.from('locations').select('id').eq('id', id).maybeSingle(); if (error) throw error; return Boolean(data)
}
