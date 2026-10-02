import Button from 'react-bootstrap/Button'
import ProgressBar from 'react-bootstrap/ProgressBar'

import type { Episode } from './episodes'
import { durationMinutes, episodeDateParts } from './episodes'

const DONE_THRESHOLD = 0.95

interface EpisodeRowProps {
  episode: Episode
  active: boolean
  playing: boolean
  progress: number
  onTogglePlay: (episode: Episode) => void
}

export default function EpisodeRow({ episode, active, playing, progress, onTogglePlay }: EpisodeRowProps) {
  const date = episodeDateParts(episode.publishedAt)
  const done = progress > DONE_THRESHOLD
  const variant = active ? 'warning' : done ? 'success' : 'primary'
  const icon = active && playing ? 'pause_circle_outline' : done ? 'done' : 'play_circle_outline'

  return (
    <div className="episode-row">
      <div className="date-badge">
        <div className="date-badge-weekday">{date.weekday}</div>
        <div className="date-badge-day">{date.day}</div>
        <div className="date-badge-month">{date.month}</div>
      </div>
      <div className="episode-details">
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="episode-program">{episode.programName}</span>
          <span className="episode-duration">{durationMinutes(episode.durationSec)} ד׳</span>
        </div>
        {episode.subtitle !== '' && <div className="episode-subtitle">{episode.subtitle}</div>}
        <ProgressBar className="mt-2" dir="ltr" animated={active} variant={variant} min={0} max={1} now={progress} />
      </div>
      <Button variant={variant} className="episode-play" onClick={() => onTogglePlay(episode)}>
        <i className="material-icons md-30">{icon}</i>
      </Button>
    </div>
  )
}
