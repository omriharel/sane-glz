import React, { useState, useEffect, useRef } from 'react';

/** @jsx jsx */
import { jsx, css } from "@emotion/core";

import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ReactPlayer from 'react-player';

const style = css`
    color: #ececec;
    text-align: center;
`;

export default function MediaPlayer(props) {
    const playerRef = useRef(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        setPlaying(true);
    }, [props.url]);

    useEffect(() => {
        setPlaying(currentlyPlaying => !currentlyPlaying);
    }, [props.toggle]);

    const onDurationKnown = duration => {
        if (playerRef.current && props.progressCallback !== null) {
            playerRef.current.seekTo(props.progressCallback(), 'fraction');
        }

        props.onDuration(duration);
    }

    const player = (
        <ReactPlayer
            ref={playerRef}
            url={props.url}
            playing={playing}
            controls
            config={{
                file: {
                    forceAudio: true,
                    attributes: {
                        style: {
                            outline: 'none',
                            width: '100%',
                        }
                    }
                }
            }}
            onPlay={props.onPlay}
            onPause={props.onPause}
            onEnded={props.onStop}
            onDuration={onDurationKnown}
            onProgress={props.onProgress}
            height={56}
            width="100%"
        />
    );

    const buttonStyle = css`
        padding-top: 5px;
        padding-bottom: 0;
        padding-left: 4px;
        padding-right: 4px;
        margin-top: 4px;
        margin-bottom: 4px;
    `;

    const buttonContainerStyle = css`
        text-align: left;
    `;

    const getResponsiveSpan = (order, size) => {
        if (size === 'md') {
            return {
                span: 6,
                order: order - 1,
            };
        }

        return {
            span: order === 1 ? 6 : 2,
            order: order - 1,
        };
    };

    const seekMedia = seconds => {
        if (!playerRef.current) {
            return;
        }

        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();

        if (currentTime + seconds >= duration) {
            setPlaying(false);
            playerRef.current.seekTo(duration, 'seconds');
        } else {
            playerRef.current.seekTo(currentTime + seconds, 'seconds');
        }
    }

    const controls = (
        <Form>
            <Form.Row>
                <Col
                    css={buttonContainerStyle}
                    md={getResponsiveSpan(1, 'md')}
                    sm={getResponsiveSpan(2, 'sm')}
                    xs={getResponsiveSpan(2, 'xs')}
                >
                    <Button variant="dark" css={buttonStyle} onClick={() => seekMedia(30)}>
                        <i className="material-icons md-30">forward_30</i>
                    </Button>
                </Col>
                <Col
                    css={buttonContainerStyle}
                    md={getResponsiveSpan(2, 'md')}
                    sm={getResponsiveSpan(3, 'sm')}
                    xs={getResponsiveSpan(3, 'xs')}
                >
                    <Button variant="dark" css={buttonStyle} onClick={() => seekMedia(-10)}>
                        <i className="material-icons md-30">replay_10</i>
                    </Button>
                </Col>
                <Col
                    css={buttonContainerStyle}
                    md={getResponsiveSpan(3, 'md')}
                    sm={getResponsiveSpan(1, 'sm')}
                    xs={getResponsiveSpan(1, 'xs')}
                >
                    <Button variant="dark" css={buttonStyle} onClick={() => seekMedia(150)}>
                        <i className="material-icons md-30">double_arrow</i>
                    </Button>
                </Col>
                <Col
                    css={buttonContainerStyle}
                    md={getResponsiveSpan(4, 'md')}
                    sm={getResponsiveSpan(4, 'sm')}
                    xs={getResponsiveSpan(4, 'xs')}
                >
                    <Button variant="dark" css={buttonStyle} onClick={() => seekMedia(-30)}>
                        <i className="material-icons md-30">replay_30</i>
                    </Button>
                </Col>
            </Form.Row>
        </Form>
    )

    return (
        <div css={style} className="pt-4 pb-0">
            {props.url ? (
                <>
                    <Container>
                        <Row>
                            <Col sm={12} xs={12} md={10} css={css`margin-top: 25px;`}>
                                {player}
                            </Col>
                            <Col sm={12} xs={12} md={2}>
                                {controls}
                            </Col>
                        </Row>
                    </Container>
                </>
             ) : <h1>Sane GLZ</h1>}
        </div>
    );
}
