import React, { useState, useEffect } from 'react'; // eslint-disable-line no-unused-vars

/** @jsx jsx */
import { css, jsx } from '@emotion/core';

import { Link } from 'react-router-dom';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Col from 'react-bootstrap/Col';

import _ from 'lodash';

import { baseApiUrl } from './constants';
import { getStored, store } from './helpers';
import Loader from './Loader';

const showsUrl = baseApiUrl + '/programmes';

export default function ShowPreferences() {
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState([]);
    const [chosenShows, setChosenShows] = useState(getStored('chosenShows') || []);
    const [daysToSee, setDaysToSee] = useState(getStored('daysToSee') || 15);
    const [daysPreferenceValid, setDaysPreferenceValid] = useState(true);
    const [showFilter, setShowFilter] = useState('');

    useEffect(() => {
        fetch(showsUrl)
        .then(response => response.json())
        .then(data => {
            setCategories(data);
            setLoading(false);
        })
        .catch(error => console.error(error));
    }, []);

    const applyShowFilter = show => showFilter !== '' ? _.includes(show.name, showFilter) : true;
    const applyCategoryFilter = category => category.programmes.filter(applyShowFilter).length !== 0;

    const toggleChosenShow = (showUrl) => {
        let result = null;
        if (_.includes(chosenShows, showUrl)) {
            result = _.without(chosenShows, showUrl);
        } else {
            result = _.concat(chosenShows, showUrl);
        }

        setChosenShows(result);
        store('chosenShows', result);
    };

    const saveDaysPreference = newValue => {
        const parsedValue = parseInt(newValue);

        if (parsedValue < 1 || parsedValue > 90 || isNaN(parsedValue)) {
            setDaysPreferenceValid(false);
            return;
        }

        setDaysToSee(parsedValue)
        store('daysToSee', parsedValue)
        setDaysPreferenceValid(true);
    };

    const advancedMenu = <>
        <div className="d-flex justify-content-end mb-3">
            <Button variant="outline-danger" onClick={() => {
                localStorage.clear();
                setChosenShows([]);
            }}>
                מחק את כל ההעדפות והיסטוריית ההשמעה
            </Button>
        </div>
    </>;

    return loading ? <Loader centered /> : (
        <>
            <Form.Row className="mb-2">
                <Col sm={7} xs={5} md={2} lg={1}>
                    <Button
                        as={Link}
                        to="/"
                        className="pt-0 pb-0 pl-3 pr-3 mb-2"

                        variant="success"
                    >
                        <i className="material-icons md-30">done</i>
                    </Button>
                </Col>
                <Col sm={5} xs={7} md={{span: 4, order: 3}} lg={{span: 3, order: 3}}>
                    <InputGroup css={css`direction: ltr`} className="pr-3">
                        <InputGroup.Prepend>
                            <InputGroup.Text>ימים אחורה</InputGroup.Text>
                        </InputGroup.Prepend>
                        <Form.Control
                            defaultValue={daysToSee.toString()}
                            css={css`width: 46px;`}
                            onChange={event => saveDaysPreference(event.target.value)}
                            isInvalid={!daysPreferenceValid}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>הצג</InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                </Col>
                <Col sm={12} xs={12} md={6} lg={8}>
                    <Form.Control
                        placeholder="חיפוש תוכניות..."
                        onChange={event => setShowFilter(event.target.value)}
                    />
                </Col>
            </Form.Row>
            <ListGroup className="mb-3">
                {categories.filter(applyCategoryFilter).map(category => {
                    return (
                        <ListGroup.Item
                            key={category.categoryName}
                            variant="dark"
                        >
                            <h3>
                                {category.categoryName}
                            </h3>
                            <ButtonToolbar>
                                {category.programmes.filter(applyShowFilter).map(show => {
                                    return (
                                        <Button
                                            variant={_.includes(chosenShows, show.url) ? 'primary' : 'dark'}
                                            className="m-1"
                                            key={show.url}
                                            onClick={() => toggleChosenShow(show.url)}
                                        >
                                            {show.name}
                                        </Button>
                                    );
                                })}
                            </ButtonToolbar>
                        </ListGroup.Item>
                    );
                })}
            </ListGroup>
            {chosenShows.length > 0 && advancedMenu}
        </>
    );
};
