import { beforeEach, describe, expect, it } from 'vitest'

import * as storage from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('storage', () => {
  it('returns defaults when nothing is stored', () => {
    expect(storage.getChosenPrograms()).toEqual([])
    expect(storage.getDaysToSee()).toBe(storage.DEFAULT_DAYS_TO_SEE)
    expect(storage.getProgress('x')).toBe(0)
    expect(storage.getSchemaVersion()).toBe(1)
  })

  it('round-trips values', () => {
    storage.setChosenPrograms(['a', 'b'])
    storage.setDaysToSee(7)
    storage.setProgress('x', 0.25)
    expect(storage.getChosenPrograms()).toEqual(['a', 'b'])
    expect(storage.getDaysToSee()).toBe(7)
    expect(storage.getProgress('x')).toBe(0.25)
  })

  it('falls back to defaults on corrupt or mistyped values', () => {
    localStorage.setItem('chosenPrograms', '{oops')
    localStorage.setItem('daysToSee', '"seven"')
    localStorage.setItem('progress:x', 'null')
    expect(storage.getChosenPrograms()).toEqual([])
    expect(storage.getDaysToSee()).toBe(storage.DEFAULT_DAYS_TO_SEE)
    expect(storage.getProgress('x')).toBe(0)
  })

  it('drops non-string program IDs', () => {
    localStorage.setItem('chosenPrograms', JSON.stringify(['a', 1, null, 'b']))
    expect(storage.getChosenPrograms()).toEqual(['a', 'b'])
  })

  it('clears everything but keeps the schema version current', () => {
    storage.setChosenPrograms(['a'])
    storage.clearAll()
    expect(storage.getChosenPrograms()).toEqual([])
    expect(storage.getSchemaVersion()).toBe(storage.SCHEMA_VERSION)
  })
})
