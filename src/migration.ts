import type { Program } from './omny/types'
import { resolveLegacyPath } from './catalog/catalog'
import { SCHEMA_VERSION, getSchemaVersion, setChosenPrograms, setSchemaVersion } from './storage'

// Keys written by the old (2020) version of the app, which used GLZ's own IDs and had online sync
const LEGACY_KEYS = ['chosenShows', 'loggedIn', 'username', 'authAccessToken', 'onlineDataFetched', 'onlineDataTimestamp']
const LEGACY_KEY_SUFFIXES = ['-progress', '-duration']

function readLegacyChosenShows(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('chosenShows') ?? '[]')
    return Array.isArray(value) ? value.filter((path): path is string => typeof path === 'string') : []
  } catch {
    return []
  }
}

// One-time upgrade from the old storage format. Saved shows are mapped to Omny programs where
// possible; listening progress can't be (episode IDs differ), so it's dropped.
export function migrateLegacyStorage(programs: Program[]): void {
  if (getSchemaVersion() >= SCHEMA_VERSION) {
    return
  }

  const programIds = readLegacyChosenShows()
    .map((path) => resolveLegacyPath(path, programs))
    .filter((id): id is string => id !== undefined)
  setChosenPrograms([...new Set(programIds)])

  for (const key of Object.keys(localStorage)) {
    if (LEGACY_KEYS.includes(key) || LEGACY_KEY_SUFFIXES.some((suffix) => key.endsWith(suffix))) {
      localStorage.removeItem(key)
    }
  }

  setSchemaVersion(SCHEMA_VERSION)
}
