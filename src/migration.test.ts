import { beforeEach, describe, expect, it } from 'vitest'

import { allPrograms, arba, nachon } from './test/fixtures'
import { migrateLegacyStorage } from './migration'
import { SCHEMA_VERSION, getChosenPrograms, getDaysToSee, getSchemaVersion, setChosenPrograms } from './storage'

function seedLegacyStorage() {
  localStorage.setItem(
    'chosenShows',
    JSON.stringify(['/גלצ/תוכניות/ארבע-אחרי-הצהריים', '/גלצ/תוכניות/נכון-להבוקר', '/גלצ/תוכניות/no-such-show']),
  )
  localStorage.setItem('daysToSee', '30')
  localStorage.setItem('loggedIn', 'true')
  localStorage.setItem('username', '"google_123"')
  localStorage.setItem('authAccessToken', '"eyJ..."')
  localStorage.setItem('onlineDataFetched', 'true')
  localStorage.setItem('onlineDataTimestamp', '1581800000000')
  localStorage.setItem('ארבע-אחרי-הצהריים-12345-progress', '0.5')
  localStorage.setItem('ארבע-אחרי-הצהריים-12345-duration', '"58:12"')
}

beforeEach(() => {
  localStorage.clear()
})

describe('migrateLegacyStorage', () => {
  it('maps saved shows, keeps days, drops everything else from the old version', () => {
    seedLegacyStorage()

    migrateLegacyStorage(allPrograms)

    expect(getChosenPrograms()).toEqual([arba.Id, nachon.Id])
    expect(getDaysToSee()).toBe(30)
    expect(getSchemaVersion()).toBe(SCHEMA_VERSION)
    expect(Object.keys(localStorage).sort()).toEqual(['chosenPrograms', 'daysToSee', 'schemaVersion'])
  })

  it('runs only once', () => {
    seedLegacyStorage()
    migrateLegacyStorage(allPrograms)
    setChosenPrograms([nachon.Id])

    migrateLegacyStorage(allPrograms)

    expect(getChosenPrograms()).toEqual([nachon.Id])
  })

  it('handles a fresh browser', () => {
    migrateLegacyStorage(allPrograms)
    expect(getChosenPrograms()).toEqual([])
    expect(getSchemaVersion()).toBe(SCHEMA_VERSION)
  })

  it('survives corrupt old data', () => {
    localStorage.setItem('chosenShows', '{not json')
    migrateLegacyStorage(allPrograms)
    expect(getChosenPrograms()).toEqual([])
    expect(localStorage.getItem('chosenShows')).toBeNull()
  })

  it('de-duplicates shows that map to the same program', () => {
    localStorage.setItem('chosenShows', JSON.stringify(['/גלצ/תוכניות/ארבע-אחרי-הצהריים', '/גלצ/תוכניות/ארבע-אחרי-הצהריים/']))
    migrateLegacyStorage(allPrograms)
    expect(getChosenPrograms()).toEqual([arba.Id])
  })
})
