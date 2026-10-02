import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ClipsPage } from './types'
import { clip } from '../test/fixtures'
import { fetchClipsSince } from './api'

function mockPages(pages: ClipsPage[]) {
  const fetchMock = vi.fn(async () => {
    const page = pages.shift()
    if (page === undefined) {
      throw new Error('unexpected extra request')
    }
    return new Response(JSON.stringify(page))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function day(date: string) {
  return clip({ Id: date, PublishedUtc: `${date}T14:00:00Z` })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchClipsSince', () => {
  const cutoff = new Date('2026-09-20T00:00:00Z')

  it('stops after the first page once it reaches past the cutoff', async () => {
    const fetchMock = mockPages([{ Clips: [day('2026-09-30'), day('2026-09-25'), day('2026-09-10')], Cursor: '2', TotalCount: 50 }])

    const clips = await fetchClipsSince('prog', cutoff)

    expect(clips.map((c) => c.Id)).toEqual(['2026-09-30', '2026-09-25'])
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]).toEqual([expect.stringMatching(/\/programs\/prog\/clips\?pageSize=100$/)])
  })

  it('follows the cursor while the whole page is newer than the cutoff', async () => {
    const fetchMock = mockPages([
      { Clips: [day('2026-09-30'), day('2026-09-28')], Cursor: '2', TotalCount: 4 },
      { Clips: [day('2026-09-25'), day('2026-09-15')], Cursor: null, TotalCount: 4 },
    ])

    const clips = await fetchClipsSince('prog', cutoff)

    expect(clips.map((c) => c.Id)).toEqual(['2026-09-30', '2026-09-28', '2026-09-25'])
    expect(fetchMock.mock.calls[1]).toEqual([expect.stringContaining('pageSize=100&cursor=2')])
  })

  it('stops on the last page', async () => {
    const fetchMock = mockPages([{ Clips: [day('2026-09-30')], Cursor: null, TotalCount: 1 }])
    expect(await fetchClipsSince('prog', cutoff)).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('handles a program with no clips', async () => {
    mockPages([{ Clips: [], Cursor: null, TotalCount: 0 }])
    expect(await fetchClipsSince('prog', cutoff)).toEqual([])
  })

  it('caps the number of pages for very busy programs', async () => {
    const busyPage: ClipsPage = { Clips: [day('2026-09-30')], Cursor: 'next', TotalCount: 35000 }
    const fetchMock = mockPages(Array.from({ length: 10 }, () => busyPage))

    expect(await fetchClipsSince('prog', cutoff)).toHaveLength(5)
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })

  it('throws on HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503, statusText: 'Service Unavailable' })))
    await expect(fetchClipsSince('prog', cutoff)).rejects.toThrow('503')
  })
})
