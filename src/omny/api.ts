import type { Clip, ClipsPage, Program, ProgramsResponse } from './types'

const OMNY_ORG_ID = '6dcbc33f-1fb6-49de-9ae2-ad8a00c01523' // GLZ
const BASE_URL = `https://api.omny.fm/orgs/${OMNY_ORG_ID}`

const PAGE_SIZE = 100
// The hourly news program alone has tens of thousands of clips
const MAX_PAGES = 5

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${url}`)
  }
  return (await response.json()) as T
}

export async function fetchPrograms(): Promise<Program[]> {
  const data = await getJson<ProgramsResponse>(`${BASE_URL}/programs`)
  return data.Programs
}

// Clips come newest first, so stop paging once a page reaches past the cutoff.
export async function fetchClipsSince(programId: string, cutoff: Date): Promise<Clip[]> {
  const clips: Clip[] = []
  let cursor: string | null = null

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ pageSize: String(PAGE_SIZE) })
    if (cursor !== null) {
      params.set('cursor', cursor)
    }

    const data: ClipsPage = await getJson<ClipsPage>(`${BASE_URL}/programs/${programId}/clips?${params}`)
    clips.push(...data.Clips.filter((clip) => new Date(clip.PublishedUtc) >= cutoff))

    const oldest = data.Clips.at(-1)
    if (data.Cursor === null || oldest === undefined || new Date(oldest.PublishedUtc) < cutoff) {
      break
    }
    cursor = data.Cursor
  }

  return clips
}
