import { describe, expect, it } from 'vitest'

import { clip, hamesh } from './test/fixtures'
import { cutoffDate, durationMinutes, episodeDateParts, episodeSubtitle, newestFirst, toEpisode } from './episodes'

describe('episodeSubtitle', () => {
  it('drops the program name and date, keeping the host', () => {
    expect(episodeSubtitle('חמש בערב | 30.09.26', 'ירון וילנסקי', 'חמש בערב')).toBe('ירון וילנסקי')
    expect(episodeSubtitle('נכון להבוקר | 01.10.26', 'אילנה דיין', 'נכון להבוקר')).toBe('אילנה דיין')
  })

  it('keeps an episode topic', () => {
    expect(episodeSubtitle('גל פתוח | נחיתת מטוס אייר דובאי | 30.09.26', 'טלי ליפקין שחק', 'חדשות גל"צ')).toBe(
      'גל פתוח | נחיתת מטוס אייר דובאי | טלי ליפקין שחק',
    )
  })

  it("doesn't repeat a host already in the title", () => {
    expect(episodeSubtitle('רותי רוסו ואריק וייס | 01.10.26', 'רותי רוסו ואריק וייס', 'קורח ושרקי')).toBe(
      'רותי רוסו ואריק וייס',
    )
  })

  it('strips a trailing date with a comma and a long-year date', () => {
    expect(
      episodeSubtitle(
        '"פחדתי מהרגע שבו אצטרך לזהות את גיא" | אילנה דיין, 16.10.2025',
        'מישל, אביו של החלל גיא אילוז שגופתו הושבה ארצה, מספר היום (חמישי) אצל אילנה דיין בגלצ',
        'אילנה דיין',
      ),
    ).toBe('"פחדתי מהרגע שבו אצטרך לזהות את גיא"')
  })

  it('ignores long or multi-line descriptions', () => {
    expect(episodeSubtitle('תוכנית | 01.10.26', 'שורה ראשונה\nשורה שנייה', 'תוכנית')).toBe('')
    expect(episodeSubtitle('תוכנית | 01.10.26', 'א'.repeat(61), 'תוכנית')).toBe('')
  })

  it('returns nothing when everything is redundant', () => {
    expect(episodeSubtitle('חדשות השעה 07:00 של גלי צה"ל', 'חדשות השעה 07:00 של גלי צה"ל', 'חדשות השעה 07:00 של גלי צה"ל')).toBe('')
    expect(episodeSubtitle('חמש בערב | 30.09.26', null, 'חמש בערב')).toBe('')
  })
})

describe('toEpisode', () => {
  it('maps an Omny clip', () => {
    const episode = toEpisode(clip({ Id: 'c1', PublishedUtc: '2026-09-30T14:03:00.06Z' }), hamesh)
    expect(episode).toEqual({
      id: 'c1',
      programId: hamesh.Id,
      programName: 'חמש בערב',
      subtitle: 'ירון וילנסקי',
      publishedAt: new Date('2026-09-30T14:03:00.06Z'),
      durationSec: 3600,
      audioUrl: 'https://traffic.omny.fm/d/clips/c1/audio.mp3',
    })
  })
})

describe('cutoffDate', () => {
  it('goes back whole days to local midnight', () => {
    const cutoff = cutoffDate(15, new Date(2026, 9, 2, 13, 45))
    expect(cutoff).toEqual(new Date(2026, 8, 17, 0, 0, 0, 0))
  })
})

describe('newestFirst', () => {
  it('sorts by publish time, descending, without mutating', () => {
    const older = toEpisode(clip({ Id: 'old', PublishedUtc: '2026-09-29T14:00:00Z' }), hamesh)
    const newer = toEpisode(clip({ Id: 'new', PublishedUtc: '2026-09-30T14:00:00Z' }), hamesh)
    const input = [older, newer]
    expect(newestFirst(input).map((e) => e.id)).toEqual(['new', 'old'])
    expect(input.map((e) => e.id)).toEqual(['old', 'new'])
  })
})

describe('episodeDateParts', () => {
  it('uses Israel time and short Hebrew names', () => {
    // 22:30 UTC on Sunday is already Monday in Israel
    expect(episodeDateParts(new Date('2026-09-27T22:30:00Z'))).toEqual({ weekday: 'שני', day: '28', month: 'ספט' })
    expect(episodeDateParts(new Date('2026-05-10T14:05:06Z'))).toEqual({ weekday: 'ראשון', day: '10', month: 'מאי' })
  })
})

describe('durationMinutes', () => {
  it('rounds to whole minutes', () => {
    expect(durationMinutes(2459.468)).toBe(41)
    expect(durationMinutes(29)).toBe(0)
  })
})
