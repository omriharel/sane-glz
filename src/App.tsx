import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'

import type { Episode } from './episodes'
import type { Program } from './omny/types'
import { fetchPrograms } from './omny/api'
import { migrateLegacyStorage } from './migration'
import * as storage from './storage'
import EpisodeList from './EpisodeList'
import Player from './Player'
import PrivacyPolicy from './PrivacyPolicy'
import ProgramPicker from './ProgramPicker'

export interface LiveProgress {
  episodeId: string
  fraction: number
}

export default function App() {
  const [programs, setPrograms] = useState<Program[] | null>(null)
  const [programsFailed, setProgramsFailed] = useState(false)
  const [chosenPrograms, setChosenPrograms] = useState(storage.getChosenPrograms)
  const [daysToSee, setDaysToSee] = useState(storage.getDaysToSee)

  const [nowPlaying, setNowPlaying] = useState<Episode | null>(null)
  const [playing, setPlaying] = useState(false)
  const [liveProgress, setLiveProgress] = useState<LiveProgress | null>(null)

  const loadPrograms = useCallback(() => {
    fetchPrograms()
      .then((result) => {
        // Must run before anything reads or writes the chosen programs
        migrateLegacyStorage(result)
        setChosenPrograms(storage.getChosenPrograms())
        setPrograms(result)
      })
      .catch((error: unknown) => {
        console.error('Failed to fetch program list', error)
        setProgramsFailed(true)
      })
  }, [])

  useEffect(() => {
    loadPrograms()
  }, [loadPrograms])

  const retryLoadPrograms = () => {
    setProgramsFailed(false)
    loadPrograms()
  }

  const togglePlay = (episode: Episode) => {
    if (nowPlaying?.id === episode.id) {
      setPlaying((current) => !current)
    } else {
      setNowPlaying(episode)
      setPlaying(true)
    }
  }

  const changeChosenPrograms = (programIds: string[]) => {
    storage.setChosenPrograms(programIds)
    setChosenPrograms(programIds)
  }

  const changeDaysToSee = (days: number) => {
    storage.setDaysToSee(days)
    setDaysToSee(days)
  }

  const resetEverything = () => {
    storage.clearAll()
    setChosenPrograms([])
    setDaysToSee(storage.DEFAULT_DAYS_TO_SEE)
    setLiveProgress(null)
  }

  let content
  if (programsFailed) {
    content = (
      <Alert variant="danger">
        <p>לא הצלחנו לטעון את רשימת התוכניות.</p>
        <Button variant="outline-danger" onClick={retryLoadPrograms}>
          נסו שוב
        </Button>
      </Alert>
    )
  } else if (programs === null) {
    content = (
      <div className="centered-spinner">
        <Spinner animation="grow" variant="light" />
      </div>
    )
  } else {
    content = (
      <Routes>
        <Route
          path="/"
          element={
            <EpisodeList
              programs={programs}
              chosenPrograms={chosenPrograms}
              daysToSee={daysToSee}
              nowPlayingId={nowPlaying?.id ?? null}
              playing={playing}
              liveProgress={liveProgress}
              onTogglePlay={togglePlay}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <ProgramPicker
              programs={programs}
              chosenPrograms={chosenPrograms}
              daysToSee={daysToSee}
              onChosenProgramsChange={changeChosenPrograms}
              onDaysToSeeChange={changeDaysToSee}
              onReset={resetEverything}
            />
          }
        />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <Player
          episode={nowPlaying}
          playing={playing}
          onPlayingChange={setPlaying}
          onProgress={(fraction) => nowPlaying && setLiveProgress({ episodeId: nowPlaying.id, fraction })}
        />
      </header>
      <main className="app-content">
        <Container>{content}</Container>
        <footer className="d-flex justify-content-center pb-2">
          <Link className="text-info" to="/privacy">
            פרטיות | Privacy
          </Link>
        </footer>
      </main>
    </div>
  )
}
