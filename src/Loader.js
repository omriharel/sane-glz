/** @jsx jsx */
import { jsx, css } from "@emotion/core";

import GridLoader from "react-spinners/GridLoader";

export default function Loader(props) {
    const style = css`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    `;

    const style2 = css`
        transform: translate(-45%, 0);
    `;

    return (
        <div css={props.centered ? style : style2}>
            <GridLoader color={props.dark ? '#8a8a8a' : '#fafafa'} size={props.size || 35} />
        </div>
    );
};
