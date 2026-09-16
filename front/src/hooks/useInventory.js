import { useCallback, useEffect, useState } from 'react'
import { getLocationPath } from '../utils/location'

const request = async (url, options) => {
  const response = await fetch(url, options)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message ?? '요청을 처리하지 못했어요.')
  }
  return response.status === 204 ? null : response.json()
}
const jsonOptions = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const addPaths = (items, locations) => items.map((item) => ({ ...item, locationPath: getLocationPath(item.locationId, locations) }))

export const useInventory = () => {
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const [nextLocations, nextItems] = await Promise.all([request('/api/locations'), request('/api/items')])
      setLocations(nextLocations); setItems(addPaths(nextItems, nextLocations))
    } catch (nextError) { setError(nextError.message) }
    finally { setIsLoading(false) }
  }, [])
  useEffect(() => {
    // 외부 API의 최초 상태를 React 메모리로 동기화한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload()
  }, [reload])

  const createLocation = async (values) => { const value = await request('/api/locations', jsonOptions('POST', values)); setLocations((current) => [...current, value]); return value }
  const updateLocation = async (id, values) => { await request(`/api/locations/${id}`, jsonOptions('PATCH', values)); await reload() }
  const deleteLocation = async (id) => { await request(`/api/locations/${id}`, jsonOptions('DELETE', { itemDestinationIds: {} })); await reload() }
  const deleteLocationWithItemMoves = async (id, itemDestinationIds) => { await request(`/api/locations/${id}`, jsonOptions('DELETE', { itemDestinationIds })); await reload() }
  const createItem = async (values) => { await request('/api/items', jsonOptions('POST', values)); await reload() }
  const updateItem = async (id, values) => { await request(`/api/items/${id}`, jsonOptions('PATCH', values)); await reload() }
  const deleteItem = async (id) => { await request(`/api/items/${id}`, { method: 'DELETE' }); await reload() }

  return { items, locations, isLoading, error, reload, createItem, updateItem, deleteItem, createLocation, updateLocation, deleteLocation, deleteLocationWithItemMoves }
}
