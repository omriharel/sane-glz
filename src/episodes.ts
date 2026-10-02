import type { Clip, Program } from './omny/types'
import { normalizeName } from './catalog/catalog'

export interface Episode {
  id: string
  programId: string
  programName: string
  subtitle: string
  publishedAt: Date
  durationSec: number
  audioUrl: string
}

// Descriptions on GLZ's daily shows are usually just the host's name; longer ones are blurbs
const MAX_HOST_LENGTH = 60

const DATE_PATTERN = /\d{1,2}[./]\d{1,2}[./]\d{2,4}/g

// Titles look like "Program | 01.10.26" or "Topic | Host, 16.10.2025". Drop the parts that
// repeat the program name or the date (both shown separately), and add the host if we know it.
export function episodeSubtitle(title: string, description: string | null, programName: string): string {
  const program = normalizeName(programName)
  const parts = title
    .split('|')
    .map((part) => part.replace(DATE_PATTERN, '').replace(/[\s,]+$/, '').trim())
    .filter((part) => part !== '' && normalizeName(part) !== program)

  const host = description?.trim() ?? ''
  const isHost = host !== '' && host.length <= MAX_HOST_LENGTH && !host.includes('\n')
  if (isHost && normalizeName(host) !== program && !parts.some((part) => normalizeName(part) === normalizeName(host))) {
    parts.push(host)
  }

  return parts.join(' | ')
}

export function toEpisode(clip: Clip, program: Program): Episode {
  return {
    id: clip.Id,
    programId: program.Id,
    programName: program.Name,
    subtitle: episodeSubtitle(clip.Title, clip.Description, program.Name),
    publishedAt: new Date(clip.PublishedUtc),
    durationSec: clip.DurationSeconds,
    audioUrl: clip.AudioUrl,
  }
}

// Start of the day, `daysBack` days ago, in the viewer's local time
export function cutoffDate(daysBack: number, now: Date = new Date()): Date {
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - daysBack)
  cutoff.setHours(0, 0, 0, 0)
  return cutoff
}

export function newestFirst(episodes: Episode[]): Episode[] {
  return episodes.toSorted((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}

const dateParts = new Intl.DateTimeFormat('he-IL', {
  timeZone: 'Asia/Jerusalem',
  weekday: 'long',
  day: '2-digit',
  month: 'short',
})

export function episodeDateParts(date: Date): { weekday: string; day: string; month: string } {
  const parts = Object.fromEntries(dateParts.formatToParts(date).map((part) => [part.type, part.value]))
  return {
    weekday: (parts.weekday ?? '').replace('יום ', ''),
    day: parts.day ?? '',
    month: (parts.month ?? '').replace(/[׳'.]$/, ''),
  }
}

export function durationMinutes(seconds: number): number {
  return Math.round(seconds / 60)
}
