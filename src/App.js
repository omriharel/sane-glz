import React, { useState } from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import './App.css';
import 'bootstrap/dist/css/bootstrap.css';

import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import MediaPlayer from './MediaPlayer';
import ShowList from './ShowList';
import ShowPreferences from './ShowPreferences';

export default function App() {
  const [url, setUrl] = useState(null);

  return (
    <div className="App">
      <Router>
        <Container>
          <Row>
            <Col>
              <MediaPlayer url={url} />
            </Col>
          </Row>
          <Row>
            <Col>
              <Switch>
                <Route path="/settings">
                  <ShowPreferences/>
                </Route>
                <Route path="/">
                  <ShowList playCallback={setUrl} />
                </Route>
              </Switch>
            </Col>
          </Row>
        </Container>
      </Router>
    </div>
  );
}
