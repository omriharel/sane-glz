import React, { useState } from 'react'; // eslint-disable-line no-unused-vars

/** @jsx jsx */
import { css, jsx } from '@emotion/core';

import _ from 'lodash';

import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Loader from './Loader';
import { store, getStored } from './helpers';

export default function Show(props) {
    const progressKey = props.show.key + '-progress';
    const durationKey = props.show.key + '-duration';

    const [progressData, setProgressData] = useState(getStored(progressKey) || 0);
    const [durationData, setDurationData] = useState(getStored(durationKey) || null);
    const [playing, setPlaying] = useState(false);

    const onProgress = (progress) => {
        store(progressKey, progress.played);
        setProgressData(progress.played);

    };

    const onKnownDuration = (duration) => {
        const durationMinutes = parseInt(duration / 60);
        const durationSeconds = parseInt(duration) % 60;

        const durationString = `${durationMinutes}:${('00' + durationSeconds.toString()).slice(-2)}`;

        store(durationKey, durationString);
        setDurationData(durationString);
    };

    const togglePlay = () => {
        const callbacks = {
            onProgress: onProgress,
            onDuration: onKnownDuration,
            onPlay: () => { setPlaying(true); },
            onPause: () => { setPlaying(false); },
            onStop: () => { setPlaying(false); },
            showProgess: () => { return progressData; },
        };

        props.playerCallback(props.show.url, callbacks);
        setPlaying(currentlyPlaying => !currentlyPlaying);
    };

    const showTitleStyle = css`
        font-weight: bold;
    `;

    const showSubTitleStyle = css`
        font-style: italic;
    `;

    const showAirTimeStyle = css`
        font-style: italic;
        font-size: 15px;
        line-height: 0;
        color: #3e3e3e;
    `;

    const showDurationStyle = css`
        font-size: 16px;
        font-weight: bold;
        line-height: 0;
    `;

    const subtitleToShow = (showName, instanceName, quote) => {
        if (showName === instanceName && quote === instanceName) {
            return '';
        }

        if (showName !== instanceName && quote === instanceName) {
            return quote;
        }

        if (instanceName.endsWith(quote)) {
            return instanceName;
        }

        if (quote.endsWith(instanceName)) {
            return quote;
        }

        return instanceName + ' - ' + quote;
    };

    const doneWithThis = progressData > 0.95;
    const elementVariant = props.active ? 'warning' : (doneWithThis ? 'success' : 'primary');

    const getDetailSpan = (span, order) => {
        return {
            span: span,
            order: order,
        };
    };

    return props.loading ? <Loader size={10} dark /> : (
    <Container>
        <Row>
            <Col sm="auto" xs="auto" md="auto">
                <div
                    className="mt-1 ml-n3 mr-n3 p-1"
                    css={css`
                        font-size: 28px;
                        font-weight: bold;
                        text-align: center;
                        border: 1px solid;
                        border-color: rgba(0, 0, 0, 0.45);
                        border-radius: 10px;
                        vertical-align: middle;
                    `}
                >
                    <div className="mb-n2 mt-1" css={css`font-size: 14px`}>
                        {{
                            1: 'ראשון',
                            2: 'שני',
                            3: 'שלישי',
                            4: 'רביעי',
                            5: 'חמישי',
                            6: 'שישי',
                            7: 'שבת',
                        }[props.show.date.getDay() + 1]}
                    </div>
                    <div>
                        {('00' + props.show.date.getDate().toString()).slice(-2)}
                    </div>
                    <div className="mt-n3" css={css`font-size: 22px; font-weight: normal;`}>
                        {{
                            1: 'ינו',
                            2: 'פבר',
                            3: 'מרץ',
                            4: 'אפר',
                            5: 'מאי',
                            6: 'יונ',
                            7: 'יול',
                            8: 'אוג',
                            9: 'ספט',
                            10: 'אוק',
                            11: 'נוב',
                            12: 'דצמ',
                        }[props.show.date.getMonth() + 1]}
                    </div>
                </div>
            </Col>
            <Col className="ml-n2 mr-n2">
                <Container>
                    <Row>
                        <Col xs={getDetailSpan(8, 1)} sm={getDetailSpan(8, 1)} md={getDetailSpan(12, 1)}>
                            <span css={showAirTimeStyle}>
                                <small>
                                    {props.show.airTime}
                                </small>
                            </span>
                        </Col>
                        <Col xs={getDetailSpan(12, 3)} sm={getDetailSpan(12, 3)} md={getDetailSpan(10, 2)}>
                            <span css={showTitleStyle}>
                                {props.show.showName}
                            </span>
                        </Col>
                        <Col xs={getDetailSpan(4, 2)} sm={getDetailSpan(4, 2)} md={getDetailSpan(2, 3)}>
                            <span css={showDurationStyle}>
                                {_.split(durationData || props.show.duration, ':')[0] + ' ד\''}
                            </span>
                        </Col>
                        <Col xs={getDetailSpan(12, 4)} sm={getDetailSpan(12, 4)} md={getDetailSpan(12, 4)}>
                            <span css={showSubTitleStyle}>
                                {subtitleToShow(props.show.showName, props.show.name, props.show.quote)}
                            </span>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <ProgressBar
                                className="mt-3"
                                animated={props.active}
                                variant={elementVariant}
                                min={0}
                                max={1}
                                now={progressData}
                                css={css`direction: ltr;`}
                            />
                        </Col>
                    </Row>
                </Container>
            </Col>
            <Col sm={2} xs={2} md={1}>
                <Button
                    variant={elementVariant}
                    className="mr-n2 mt-3 mb-3"
                    onClick={togglePlay}
                >
                    <i className="material-icons md-30">
                        {props.active && playing ? 'pause_circle_outline' : (
                            doneWithThis ? 'done' : 'play_circle_outline'
                        )}
                    </i>
                </Button>
            </Col>
        </Row>
    </Container>
    );
}
