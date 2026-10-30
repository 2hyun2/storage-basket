import type { QueryClient } from '@tanstack/react-query'

type Page<T> = { data: T[] | null; error: { message: string } | null }

// 작은 페이지를 끝까지 읽는다. 서버의 응답 행 제한을 전체 결과로 오인하지 않는다.
export async function readAllPages<T>(
  page: (from: number, to: number) => PromiseLike<Page<T>>,
  signal?: AbortSignal,
): Promise<T[]> {
  const rows: T[] = []
  let offset = 0
  for (;;) {
    signal?.throwIfAborted()
    const result = await page(offset, offset + 199)
    signal?.throwIfAborted()
    if (result.error) throw result.error
    if (!result.data?.length) return rows
    rows.push(...result.data)
    offset += result.data.length
  }
}

export async function cachedRows<T>(
  client: QueryClient,
  table: string,
  homeId: string,
  page: (from: number, to: number) => PromiseLike<Page<T>>,
): Promise<Page<T>> {
  try {
    const data = await client.fetchQuery({
      queryKey: ['inventory-table', table, homeId],
      queryFn: ({ signal }) => readAllPages(page, signal),
      staleTime: 60_000,
    })
    return { data, error: null }
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : '데이터를 불러오지 못했습니다.'
    return { data: null, error: { message } }
  }
}
