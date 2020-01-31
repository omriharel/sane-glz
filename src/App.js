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
  const [onProgressCallback, setOnProgressCallback] = useState(null);
  const [onDurationCallback, setOnDurationCallback] = useState(null);
  const [onPlayCallback, setOnPlayCallback] = useState(null);
  const [onPauseCallback, setOnPauseCallback] = useState(null);
  const [onStopCallback, setOnStopCallback] = useState(null);
  const [progressCallback, setProgressCallback] = useState(null);
  const [pauseToggle, setPauseToggle] = useState(false);


  return (
    <div className="App">
      <div className="sane-glz-header">
        <MediaPlayer
          url={url}
          onDuration={onDurationCallback}
          onProgress={onProgressCallback}
          onPlay={onPlayCallback}
          onPause={onPauseCallback}
          onStop={onStopCallback}
          progressCallback={progressCallback}
          toggle={pauseToggle}
        />
      </div>
      <div className="sane-glz-content">
        <Router>
          <Container>
            <Row>
              <Col>
                <Switch>
                  <Route path="/settings">
                    <ShowPreferences/>
                  </Route>
                  <Route path="/">
                    <ShowList playerCallback={(targetUrl, callbacks) => {
                      setUrl(currentUrl => {
                        if (targetUrl !== currentUrl) {
                          return targetUrl;
                        }

                        setPauseToggle(currentState => !currentState);
                        return currentUrl;
                      });

                      setOnProgressCallback(() => callbacks.onProgress);
                      setOnDurationCallback(() => callbacks.onDuration);
                      setOnPlayCallback(() => callbacks.onPlay);
                      setOnPauseCallback(() => callbacks.onPause);
                      setOnStopCallback(() => callbacks.onStop);
                      setProgressCallback(() => callbacks.showProgess);
                    }} />
                  </Route>
                </Switch>
              </Col>
            </Row>
          </Container>
        </Router>
      </div>
    </div>
  );
}
