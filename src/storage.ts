// Everything the app remembers lives in this browser's localStorage, as JSON.

export const SCHEMA_VERSION = 2
export const DEFAULT_DAYS_TO_SEE = 15

const keys = {
  schemaVersion: 'schemaVersion',
  chosenPrograms: 'chosenPrograms',
  daysToSee: 'daysToSee',
  progress: (episodeId: string) => `progress:${episodeId}`,
}

function read(key: string): unknown {
  const raw = localStorage.getItem(key)
  if (raw === null) {
    return undefined
  }
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getSchemaVersion(): number {
  const value = read(keys.schemaVersion)
  return typeof value === 'number' ? value : 1
}

export function setSchemaVersion(version: number): void {
  write(keys.schemaVersion, version)
}

export function getChosenPrograms(): string[] {
  const value = read(keys.chosenPrograms)
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
}

export function setChosenPrograms(programIds: string[]): void {
  write(keys.chosenPrograms, programIds)
}

export function getDaysToSee(): number {
  const value = read(keys.daysToSee)
  return typeof value === 'number' ? value : DEFAULT_DAYS_TO_SEE
}

export function setDaysToSee(days: number): void {
  write(keys.daysToSee, days)
}

// Fraction (0..1) of the episode already played
export function getProgress(episodeId: string): number {
  const value = read(keys.progress(episodeId))
  return typeof value === 'number' ? value : 0
}

export function setProgress(episodeId: string, fraction: number): void {
  write(keys.progress(episodeId), fraction)
}

export function clearAll(): void {
  localStorage.clear()
  setSchemaVersion(SCHEMA_VERSION)
}
