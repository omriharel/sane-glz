import React, { useState } from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  Link
} from 'react-router-dom';

import './App.css';
import 'bootstrap/dist/css/bootstrap.css';

import QueryString from 'query-string';
import JwtDecode from 'jwt-decode';

import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import MediaPlayer from './MediaPlayer';
import ShowList from './ShowList';
import ShowPreferences from './ShowPreferences';
import PrivacyPolicy from './PrivacyPolicy';
import Logout from './Logout';

import { store } from './helpers';

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
                  <Route path="/privacy">
                    <PrivacyPolicy/>
                  </Route>
                  <Route path="/logout">
                    <Logout/>
                  </Route>
                  <Route path="/" render={routeProps => {
                    const hashParams = QueryString.parse(routeProps.location.hash);
                    if (hashParams.access_token !== undefined) {
                      store('loggedIn', true);
                      store('authAccessToken', hashParams.access_token);

                      const tokenUsername = JwtDecode(hashParams.access_token).username;
                      store('username', tokenUsername);

                      return <Redirect to="/" />;
                    }

                    return (
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
                    );
                  }}/>
                </Switch>
              </Col>
            </Row>
          </Container>
        </Router>
        <div className="d-flex justify-content-center mb-2 mt-n2">
          <a className="text-info" as={Link} to="/privacy" href="/privacy">פרטיות | Privacy</a>
        </div>
      </div>
    </div>
  );
}
