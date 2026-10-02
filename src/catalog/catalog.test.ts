import { describe, expect, it } from 'vitest'

import { achinoam, allPrograms, arba, hamesh, nachon, news, noNetwork, program, unmappedPodcast, yardenDidi } from '../test/fixtures'
import { groupPrograms, normalizeName, resolveLegacyPath } from './catalog'

describe('normalizeName', () => {
  it('keeps only letters and digits', () => {
    expect(normalizeName("ארכיון גל''צ: קורין אלאל ז״ל")).toBe('ארכיוןגלצקוריןאלאלזל')
    expect(normalizeName('67׳ שלי')).toBe('67שלי')
    expect(normalizeName('Hello, World')).toBe('helloworld')
  })
})

describe('groupPrograms', () => {
  const groups = groupPrograms(allPrograms)
  const byName = Object.fromEntries(groups.map((group) => [group.name, group.programs.map((p) => p.Id)]))

  it('puts mapped programs under their GLZ category', () => {
    expect(byName['חדשות']).toEqual(expect.arrayContaining([hamesh.Id, nachon.Id]))
    expect(byName['מוזיקה']).toEqual([arba.Id])
    expect(byName['תרבות ופנאי']).toEqual([yardenDidi.Id])
  })

  it('falls back to network groups for unmapped programs', () => {
    expect(byName['עוד מגלי צה״ל']).toEqual([news.Id])
    expect(byName['עוד מגלגלצ']).toEqual([achinoam.Id])
    expect(byName['פודקאסטים']).toEqual([unmappedPodcast.Id])
    expect(byName['אחר']).toEqual([noNetwork.Id])
  })

  it('orders GLZ categories before fallback groups', () => {
    expect(groups.map((group) => group.name)).toEqual([
      'חדשות',
      'תרבות ופנאי',
      'מוזיקה',
      'עוד מגלי צה״ל',
      'עוד מגלגלצ',
      'פודקאסטים',
      'אחר',
    ])
  })

  it('leaves out archived and hidden programs', () => {
    const ids = groups.flatMap((group) => group.programs.map((p) => p.Id))
    expect(ids).not.toContain('archived-id')
    expect(ids).not.toContain('hidden-id')
  })

  it('filters by search and drops empty groups', () => {
    expect(groupPrograms(allPrograms, ' בערב ')).toEqual([{ name: 'חדשות', programs: [hamesh] }])
    expect(groupPrograms(allPrograms, 'nothing matches')).toEqual([])
  })

  it('sorts programs by name within a group', () => {
    const a = program({ Id: 'a', Name: 'תוכנית ב', Network: 'Podcasts' })
    const b = program({ Id: 'b', Name: 'תוכנית א', Network: 'Podcasts' })
    expect(groupPrograms([a, b])[0]?.programs.map((p) => p.Id)).toEqual(['b', 'a'])
  })
})

describe('resolveLegacyPath', () => {
  it('uses the menu snapshot, including aliased names', () => {
    expect(resolveLegacyPath('/גלצ/תוכניות/ארבע-אחרי-הצהריים', allPrograms)).toBe(arba.Id)
    expect(resolveLegacyPath('/גלצ/תוכניות/שבת-בבוקר-עם-ירדן-ודידי', allPrograms)).toBe(yardenDidi.Id)
  })

  it('ignores snapshot entries for programs that no longer exist', () => {
    expect(resolveLegacyPath('/גלצ/תוכניות/ארבע-אחרי-הצהריים', [hamesh])).toBeUndefined()
  })

  it('falls back to matching the slug against program names', () => {
    const renamed = program({ Id: 'new-show', Name: 'תוכנית חדשה לגמרי' })
    expect(resolveLegacyPath('/גלצ/תוכניות/תוכנית-חדשה-לגמרי', [renamed])).toBe('new-show')
    expect(resolveLegacyPath(`/גלצ/תוכניות/${encodeURIComponent('תוכנית-חדשה-לגמרי')}`, [renamed])).toBe('new-show')
  })

  it('gives up on ambiguous, unknown or empty slugs', () => {
    const twin1 = program({ Id: 'twin1', Name: 'סודות גלצ' })
    const twin2 = program({ Id: 'twin2', Name: 'סודות גל"צ' })
    expect(resolveLegacyPath('/גלצ/תוכניות/סודות-גלצ', [twin1, twin2])).toBeUndefined()
    expect(resolveLegacyPath('/גלצ/תוכניות/no-such-show', allPrograms)).toBeUndefined()
    expect(resolveLegacyPath('/גלצ/תוכניות/', allPrograms)).toBeUndefined()
    expect(resolveLegacyPath('/גלצ/תוכניות/%E0%A4%A', allPrograms)).toBeUndefined()
  })
})
