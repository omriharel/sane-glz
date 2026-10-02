import { useState } from 'react'
import { Link } from 'react-router'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import ListGroup from 'react-bootstrap/ListGroup'
import Row from 'react-bootstrap/Row'

import type { Program } from './omny/types'
import { groupPrograms } from './catalog/catalog'
import { DEFAULT_DAYS_TO_SEE } from './storage'

const MIN_DAYS = 1
const MAX_DAYS = 90

interface ProgramPickerProps {
  programs: Program[]
  chosenPrograms: string[]
  daysToSee: number
  onChosenProgramsChange: (programIds: string[]) => void
  onDaysToSeeChange: (days: number) => void
  onReset: () => void
}

export default function ProgramPicker(props: ProgramPickerProps) {
  const { programs, chosenPrograms, daysToSee, onChosenProgramsChange, onDaysToSeeChange, onReset } = props

  const [search, setSearch] = useState('')
  const [daysInput, setDaysInput] = useState(String(daysToSee))

  const days = Number(daysInput)
  const daysValid = Number.isInteger(days) && days >= MIN_DAYS && days <= MAX_DAYS

  const changeDays = (value: string) => {
    setDaysInput(value)
    const parsed = Number(value)
    if (Number.isInteger(parsed) && parsed >= MIN_DAYS && parsed <= MAX_DAYS) {
      onDaysToSeeChange(parsed)
    }
  }

  const toggleProgram = (programId: string) => {
    onChosenProgramsChange(
      chosenPrograms.includes(programId)
        ? chosenPrograms.filter((id) => id !== programId)
        : [...chosenPrograms, programId],
    )
  }

  const reset = () => {
    onReset()
    setDaysInput(String(DEFAULT_DAYS_TO_SEE))
  }

  return (
    <>
      <Row className="mb-3 g-2 align-items-center">
        <Col xs="auto">
          <Link className="btn btn-success" to="/" aria-label="סיום">
            <i className="material-icons md-30">done</i>
          </Link>
        </Col>
        <Col xs md={{ span: 4, order: 3 }} lg={3}>
          <InputGroup>
            <InputGroup.Text>הצג</InputGroup.Text>
            <Form.Control
              className="days-input"
              inputMode="numeric"
              value={daysInput}
              onChange={(event) => changeDays(event.target.value)}
              isInvalid={!daysValid}
            />
            <InputGroup.Text>ימים אחורה</InputGroup.Text>
          </InputGroup>
        </Col>
        <Col xs={12} md>
          <Form.Control placeholder="חיפוש תוכניות..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </Col>
      </Row>
      <ListGroup className="mb-3">
        {groupPrograms(programs, search).map((group) => (
          <ListGroup.Item key={group.name} variant="dark">
            <h3>{group.name}</h3>
            <div className="d-flex flex-wrap">
              {group.programs.map((program) => (
                <Button
                  key={program.Id}
                  variant={chosenPrograms.includes(program.Id) ? 'primary' : 'dark'}
                  className="m-1"
                  onClick={() => toggleProgram(program.Id)}
                >
                  {program.Name}
                </Button>
              ))}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      {chosenPrograms.length > 0 && (
        <div className="d-flex justify-content-end mb-3">
          <Button variant="outline-danger" onClick={reset}>
            מחק את כל ההעדפות והיסטוריית ההשמעה
          </Button>
        </div>
      )}
    </>
  )
}
