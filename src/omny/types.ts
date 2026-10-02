// The subset of Omny Studio's public API (api.omny.fm) responses that we use.

export interface Program {
  Id: string
  Name: string
  Slug: string
  Network: string | null
  Archived: boolean
  Hidden: boolean
  ArtworkUrl: string | null
}

export interface ProgramsResponse {
  Programs: Program[]
}

export interface Clip {
  Id: string
  ProgramId: string
  Title: string
  Description: string | null
  PublishedUtc: string
  DurationSeconds: number
  AudioUrl: string
}

export interface ClipsPage {
  Clips: Clip[]
  // Opaque token for the next page, or null on the last page
  Cursor: string | null
  TotalCount: number
}
