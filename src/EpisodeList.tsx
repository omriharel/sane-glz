import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import Alert from 'react-bootstrap/Alert'
import ListGroup from 'react-bootstrap/ListGroup'
import Spinner from 'react-bootstrap/Spinner'

import type { LiveProgress } from './App'
import type { Episode } from './episodes'
import type { Program } from './omny/types'
import { cutoffDate, newestFirst, toEpisode } from './episodes'
import { fetchClipsSince } from './omny/api'
import { getProgress } from './storage'
import EpisodeRow from './EpisodeRow'

const REFRESH_INTERVAL_MS = 30 * 60 * 1000
const RETRY_DELAY_MS = 10 * 1000

interface EpisodeListProps {
  programs: Program[]
  chosenPrograms: string[]
  daysToSee: number
  nowPlayingId: string | null
  playing: boolean
  liveProgress: LiveProgress | null
  onTogglePlay: (episode: Episode) => void
}

export default function EpisodeList(props: EpisodeListProps) {
  const { programs, chosenPrograms, daysToSee, nowPlayingId, playing, liveProgress, onTogglePlay } = props

  const [episodesByProgram, setEpisodesByProgram] = useState<Record<string, Episode[]>>({})
  const [failedPrograms, setFailedPrograms] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const selected = useMemo(
    () => programs.filter((program) => chosenPrograms.includes(program.Id)),
    [programs, chosenPrograms],
  )

  useEffect(() => {
    let cancelled = false
    const retryTimers: number[] = []

    const load = async (program: Program, retryOnFailure: boolean): Promise<void> => {
      try {
        const clips = await fetchClipsSince(program.Id, cutoffDate(daysToSee))
        if (cancelled) {
          return
        }
        setEpisodesByProgram((current) => ({ ...current, [program.Id]: clips.map((clip) => toEpisode(clip, program)) }))
        setFailedPrograms((current) => new Set([...current].filter((id) => id !== program.Id)))
      } catch (error) {
        console.error(`Failed to fetch episodes of ${program.Name}`, error)
        if (cancelled) {
          return
        }
        if (retryOnFailure) {
          retryTimers.push(window.setTimeout(() => void load(program, false), RETRY_DELAY_MS))
        } else {
          setFailedPrograms((current) => new Set([...current, program.Id]))
        }
      }
    }

    const refresh = async () => {
      await Promise.all(selected.map((program) => load(program, true)))
      if (!cancelled) {
        setLoading(false)
      }
    }

    void refresh()
    const timer = setInterval(() => void refresh(), REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
      retryTimers.forEach((id) => clearTimeout(id))
    }
  }, [selected, daysToSee])

  if (selected.length === 0) {
    return (
      <Alert variant="primary">
        <Alert.Heading>היי!</Alert.Heading>
        <p>
          די ריק פה... למה שלא{' '}
          <Link className="alert-link" to="/settings">
            תבחרו דברים לשמוע?
          </Link>
        </p>
        <hr />
        <div className="d-flex justify-content-end">
          <Link className="btn btn-outline-primary" to="/settings">
            קח אותי כמו שמעולם שלא לקחת אף אחד
          </Link>
        </div>
      </Alert>
    )
  }

  const cutoff = cutoffDate(daysToSee)
  const episodes = newestFirst(
    selected.flatMap((program) => episodesByProgram[program.Id] ?? []).filter((episode) => episode.publishedAt >= cutoff),
  )
  const failedNames = selected.filter((program) => failedPrograms.has(program.Id)).map((program) => program.Name)

  return (
    <>
      <div className="mb-2">
        <Link className="btn btn-success" to="/settings" aria-label="הגדרות">
          <i className="material-icons md-30">settings</i>
        </Link>
      </div>
      {failedNames.length > 0 && <Alert variant="warning">לא הצלחנו לטעון את: {failedNames.join(', ')}</Alert>}
      {loading ? (
        <div className="centered-spinner">
          <Spinner animation="grow" variant="light" />
        </div>
      ) : episodes.length === 0 ? (
        <Alert variant="secondary">אין פרקים מהימים האחרונים בתוכניות שבחרת.</Alert>
      ) : (
        <ListGroup className="mb-3">
          {episodes.map((episode) => (
            <ListGroup.Item key={episode.id}>
              <EpisodeRow
                episode={episode}
                active={episode.id === nowPlayingId}
                playing={playing}
                progress={liveProgress?.episodeId === episode.id ? liveProgress.fraction : getProgress(episode.id)}
                onTogglePlay={onTogglePlay}
              />
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </>
  )
}
