import React, { useState, useEffect } from 'react'

import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { Link } from 'react-router-dom';

import _ from 'lodash';

import Show from './Show';
import { baseApiUrl, authLoginPageUrl, authLogoutPageUrl } from './constants';
import { getStored, fetchOnlineData } from './helpers';
import Loader from './Loader';

const baseShowUrl = baseApiUrl + '/program';
const strippedUrlPrefix = '/גלצ/תוכניות/';

export default function ShowList(props) {
    const [loggedIn,] = useState(getStored('loggedIn') || false);
    const [username,] = useState(getStored('username') || null);
    const [daysToSee, setDaysToSee] = useState(getStored('daysToSee') || 15);
    const [shows, setShows] = useState(getStored('chosenShows') || []);
    const [initiallyLoading, setInitiallyLoading] = useState(true);
    const [numOfShows, setNumOfShows] = useState(shows.length);
    const [fetchedShowsCounter, setFetchedShowsCounter] = useState(0);
    const [currentlyPlayingShow, setCurrentlyPlayingShow] = useState(null);

    // map of showKey -> showObject
    const [fetchedShows, setFetchedShows] = useState({});

    useEffect(() => {
        fetchOnlineData(() => {
            setDaysToSee(getStored('daysToSee') || 15);
            setShows(getStored('chosenShows') || []);
        });
    }, []);

    useEffect(() => {
        if (fetchedShowsCounter === numOfShows && initiallyLoading) {
            setInitiallyLoading(false);
        }
    }, [fetchedShowsCounter, numOfShows, initiallyLoading]);

    useEffect(() => {
        const processNewShowData = (showKey, showUrl, data) => {
            setFetchedShowsCounter(counter => counter + 1);

            // errors from the api return with this key
            if (data.message === undefined) {
                setFetchedShows(currentFetchedShows => {
                    currentFetchedShows[showKey] = data;
                    return currentFetchedShows;
                });
            } else {
                setFetchedShows(currentFetchedShows => {
                    currentFetchedShows[showKey] = {loading: true};
                    return currentFetchedShows;
                });

                setTimeout(() => {
                    fetch(showUrl)
                    .then(response => response.json())
                    .then(data => processNewShowData(showKey, showUrl, data))
                    .catch(error => console.error(`Failed to retry show fetch at ${showUrl}`, error));
                }, 1000 * 10); // retry 10 seconds later
            }
        }

        const pollShowList = () =>  {
            const showKeys = shows.map(showUrl => showUrl.replace(strippedUrlPrefix, ''));
            const showUrls = showKeys.map(showKey => baseShowUrl + '/' + showKey);

            setNumOfShows(showUrls.length);
            setFetchedShowsCounter(0);

            showUrls.forEach((showUrl, idx) => {
                fetch(showUrl)
                .then(response => response.json())
                .then(data => processNewShowData(showKeys[idx], showUrl, data))
                .catch(error => console.error(`Failed to fetch show at ${showUrl}`, error));
            });
        };

        pollShowList();
        let timerId = setInterval(pollShowList, 1000 * 600 * 3) // every 30 mins

        return () => clearInterval(timerId);
    }, [shows]);

    const showInstances = [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToSee);
    cutoffDate.setHours(0, 0, 0, 0);

    Object.entries(fetchedShows).forEach(([showKey, showData]) => {
        if (showData.latest === undefined) {
            return;
        }

        showData.latest.forEach(instance => {
            const instanceDate = new Date();
            const [dd, mm, yy] = _.split(instance.date, '.').map(s => parseInt(s, 10));
            instanceDate.setFullYear(2000 + yy, mm - 1, dd);
            instanceDate.setHours(0, 0, 0, 0);

            if (instanceDate >= cutoffDate) {
                showInstances.push({
                    showKey: showKey,
                    key: showKey + '-' + instance.id,
                    id: instance.id,
                    showName: showData.name,
                    name: instance.name,
                    url: instance.fileUrl,
                    dateStr: instance.date,
                    date: instanceDate,
                    quote: instance.quote,
                    duration: instance.totalTime,
                    airTime: showData.airTime,
                });
            }
        });
    });

    showInstances.sort((a, b) => a.id < b.id ? 1 : -1);

    const showPlayClickedCallback = (showUrl, callbacks) => {
        props.playerCallback(showUrl, callbacks);
        setCurrentlyPlayingShow(showUrl);
    }

    const authControls = (
        <div className="flex-shrink">
            {loggedIn ? <>
                {_.startsWith(username, 'google_') ? <>
                    <span className="text-light">מחובר/ת עם Google</span>
                </> : <>
                    <span className="text-light">מחובר/ת בתור <b>{username}</b></span>
                </>}
                <span className="text-light">&nbsp;&nbsp;(<a className="text-warning" href={authLogoutPageUrl}>
                    יציאה
                </a>)</span>
            </> : <>
                <Button href={authLoginPageUrl} variant="outline-light">
                    התחברו לסנכרון בין מכשירים
                </Button>
            </>
            }
        </div>
    );


    return (
        <>
            <div className="d-flex align-items-baseline justify-content-between mb-2">
                <Button className="flex-shrink" as={Link} to="/settings" variant="success">
                    <i className="material-icons mt-30">settings</i>
                </Button>
                {/* <Button className="mr-1">
                    <i className="material-icons mt-30">sort</i>
                </Button> */}
                {authControls}
            </div>
            {shows.length === 0 &&
            <Alert variant="primary">
                <Alert.Heading>
                    היי!
                </Alert.Heading>
                <p>
                    די ריק פה...
                    למה שלא <Alert.Link as={Link} to="/settings">תבחרו דברים לשמוע?</Alert.Link>
                </p>
                <hr />
                <div className="d-flex justify-content-end">
                    <Button as={Link} to="/settings" variant="outline-primary">
                        קח אותי כמו שמעולם שלא לקחת אף אחד
                    </Button>
                </div>
            </Alert>}
            {shows.length > 0 && initiallyLoading ? <Loader centered /> : (
                <>
                    <ListGroup className="mb-3">
                        {showInstances.map(instance => {
                            return (
                                <ListGroup.Item
                                    key={instance.key}
                                >
                                    <Show
                                        show={instance}
                                        playerCallback={showPlayClickedCallback}
                                        active={instance.url === currentlyPlayingShow}
                                    />
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                </>
            )}
        </>
    );
}
