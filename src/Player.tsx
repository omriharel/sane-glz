import { useEffect, useRef } from 'react'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'

import type { Episode } from './episodes'
import { getProgress, setProgress } from './storage'

const SAVE_INTERVAL_MS = 5000
const DONE_THRESHOLD = 0.95

interface PlayerProps {
  episode: Episode | null
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  onProgress: (fraction: number) => void
}

const SEEK_BUTTONS = [
  { seconds: -30, icon: 'replay_30' },
  { seconds: -10, icon: 'replay_10' },
  { seconds: 30, icon: 'forward_30' },
  { seconds: 150, icon: 'double_arrow' },
]

export default function Player({ episode, playing, onPlayingChange, onProgress }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastSavedAt = useRef(0)

  // Drive the element from the `playing` prop; its own controls report back via onPlay/onPause
  useEffect(() => {
    const audio = audioRef.current
    if (audio === null) {
      return
    }
    if (playing && audio.paused) {
      audio.play().catch((error: unknown) => {
        console.error('Playback failed', error)
        onPlayingChange(false)
      })
    } else if (!playing && !audio.paused) {
      audio.pause()
    }
  }, [playing, episode, onPlayingChange])

  useEffect(() => {
    if (episode !== null && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: episode.programName, artist: episode.subtitle })
    }
  }, [episode])

  if (episode === null) {
    return (
      <Container className="d-flex align-items-center justify-content-center h-100">
        <h1 className="logo-title" dir="ltr">
          Sane
          <br />
          GLZ
        </h1>
        <img className="me-3" src="/logo192.png" alt="Sane GLZ logo" height={100} />
      </Container>
    )
  }

  const saveProgress = (force: boolean) => {
    const audio = audioRef.current
    if (audio === null || !Number.isFinite(audio.duration) || audio.duration === 0) {
      return
    }
    const fraction = audio.currentTime / audio.duration
    onProgress(fraction)

    const now = Date.now()
    if (force || now - lastSavedAt.current >= SAVE_INTERVAL_MS) {
      lastSavedAt.current = now
      setProgress(episode.id, fraction)
    }
  }

  const resumeFromSavedProgress = () => {
    const audio = audioRef.current
    const saved = getProgress(episode.id)
    if (audio !== null && saved > 0 && saved < DONE_THRESHOLD) {
      audio.currentTime = saved * audio.duration
    }
  }

  const seek = (seconds: number) => {
    const audio = audioRef.current
    if (audio === null || !Number.isFinite(audio.duration)) {
      return
    }
    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration)
  }

  return (
    <Container className="player">
      <audio
        ref={audioRef}
        src={episode.audioUrl}
        controls
        preload="metadata"
        onLoadedMetadata={resumeFromSavedProgress}
        onPlay={() => onPlayingChange(true)}
        onPause={() => {
          onPlayingChange(false)
          saveProgress(true)
        }}
        onEnded={() => saveProgress(true)}
        onTimeUpdate={() => saveProgress(false)}
      />
      <div className="player-controls" dir="ltr">
        {SEEK_BUTTONS.map(({ seconds, icon }) => (
          <Button key={seconds} variant="dark" onClick={() => seek(seconds)} aria-label={`${seconds}s`}>
            <i className="material-icons md-30">{icon}</i>
          </Button>
        ))}
      </div>
      <div className="player-title text-truncate">
        <b>{episode.programName}</b>
        {episode.subtitle !== '' && <span> · {episode.subtitle}</span>}
      </div>
    </Container>
  )
}
