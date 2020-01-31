import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Col from 'react-bootstrap/Col';

import _ from 'lodash';

import { baseApiUrl } from './constants';
import { getStored, store } from './helpers';
import Loader from './Loader';

const showsUrl = baseApiUrl + '/programmes';

export default function ShowPreferences(props) {
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState([]);
    const [chosenShows, setChosenShows] = useState(getStored('chosenShows') || []);
    const [showFilter, setShowFilter] = useState('');

    const pollShowList = () => {
        fetch(showsUrl)
        .then(response => response.json())
        .then(data => {
            setCategories(data);
            setLoading(false);
        })
        .catch(error => console.error(error));
    };

    useEffect(() => {
        pollShowList();
    }, []);

    const applyShowFilter = show => showFilter !== "" ? _.includes(show.name, showFilter) : true;
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

    return loading ? <Loader centered /> : (
        <>
            <Form.Row className="mb-2">
                <Col sm={2} xs={2} md={1}>
                    <Button
                        as={Link}
                        to="/"
                        className="p-0"
                        style={{width: "100%"}}
                        variant="success"
                    >
                        <i className="material-icons md-30">done</i>
                    </Button>
                </Col>
                <Col>
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
        </>
    );
};
