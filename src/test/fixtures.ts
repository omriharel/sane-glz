import type { Clip, Program } from '../omny/types'

// Trimmed from real api.omny.fm responses (October 2026)

export function program(overrides: Partial<Program> & Pick<Program, 'Id' | 'Name'>): Program {
  return { Slug: 'slug', Network: 'Galatz', Archived: false, Hidden: false, ArtworkUrl: null, ...overrides }
}

export const hamesh = program({ Id: '6ff2079f-94fa-4034-b51f-ade9006dc936', Name: 'חמש בערב' })
export const arba = program({ Id: 'aecf808e-5e02-4515-81fa-ade800e68d27', Name: 'ארבע אחרי הצהריים' })
export const nachon = program({ Id: '475d3a71-a14c-43a9-8818-adcb00f9c8d9', Name: 'נכון להבוקר' })
export const yardenDidi = program({ Id: '714db7c5-7f92-4421-a22c-adef00ed9993', Name: 'ירדן ודידי' })
export const achinoam = program({ Id: 'ba5498e3-7523-4424-8388-add7016c9350', Name: 'אחינעם בר', Network: 'GLGLZ' })
export const news = program({ Id: '642b5ea6-ce25-4da0-94b8-ade800c22a62', Name: 'מהדורות החדשות של גלי צה"ל' })
export const unmappedPodcast = program({ Id: 'podcast-id', Name: 'פודקאסט חדש', Network: 'Podcasts' })
export const noNetwork = program({ Id: 'no-network-id', Name: 'משהו אחר', Network: null })
export const archived = program({ Id: 'archived-id', Name: 'תוכנית ישנה', Archived: true })
export const hidden = program({ Id: 'hidden-id', Name: 'תוכנית נסתרת', Hidden: true })

export const allPrograms = [hamesh, arba, nachon, yardenDidi, achinoam, news, unmappedPodcast, noNetwork, archived, hidden]

export function clip(overrides: Partial<Clip> & Pick<Clip, 'Id' | 'PublishedUtc'>): Clip {
  return {
    ProgramId: hamesh.Id,
    Title: 'חמש בערב | 30.09.26',
    Description: 'ירון וילנסקי',
    DurationSeconds: 3600,
    AudioUrl: `https://traffic.omny.fm/d/clips/${overrides.Id}/audio.mp3`,
    ...overrides,
  }
}
