import React from 'react';
import './Goose.css';

export enum GooseState {
    IDLE = "gg-idle-cropped.png",
    THINKING = "gg-investigative-cropped.png",
    HAPPY = "gg-happy-cropped-more.png",
}

export interface GooseProps {
    gooseState: GooseState
}

export function GuessingGoose(props: GooseProps): JSX.Element {
    return (
        <figure className="gg">
            <img className="gg" src={props.gooseState.toString()} alt="Guessing Goose is a cutie"/>
        </figure>
    );
}