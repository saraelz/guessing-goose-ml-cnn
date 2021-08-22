import React from 'react';
import './Goose.css';
import IDLE_GOOSE from "./ggImages/gg-idle-cropped.png";
import THINKING_GOOSE from "./ggImages/gg-investigative-cropped.png";
import HAPPY_GOOSE from "./ggImages/gg-happy-cropped-more.png";

export enum GooseState {
    IDLE,
    THINKING,
    HAPPY ,
}

const GooseImages = [IDLE_GOOSE, THINKING_GOOSE, HAPPY_GOOSE];

export interface GooseProps {
    gooseState: GooseState
}

export function GuessingGoose(props: GooseProps): JSX.Element {
    return (
        <figure className="gg">
            <img className="gg" src={GooseImages[props.gooseState]} alt="Guessing Goose is a cutie"/>
        </figure>
    );
}