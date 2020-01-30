import React, { useRef } from 'react';

/** @jsx jsx */
import { jsx, css } from "@emotion/core";

import ReactPlayer from 'react-player';

const style = css`
    height: 100px;
    color: #ececec;
    text-align: center;
`;

export default function MediaPlayer(props) {
    const playerRef = useRef(null);

    const player = (
        <ReactPlayer
            ref={playerRef}
            url={props.url}
            playing
            controls
            config={{
                file: {
                    forceAudio: true
                }
            }}
            onDuration={props.onDuration}
            onProgress={props.onProgress}
            height={100}
            width="100%"
            className="mt-n4 pb-4"
        />
    );

    return (
        <div css={style} className="pt-4 pb-0">
            {props.url ? player : <h1>Sane GLZ</h1>}
        </div>
    );
}
