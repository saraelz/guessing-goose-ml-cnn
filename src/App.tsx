import React, {useEffect, useState} from 'react';
import './App.css';
import {GooseState, GuessingGoose} from "./Goose";
import CanvasBoard from "./CanvasBoard";
import * as tf from "@tensorflow/tfjs";
// eslint-disable-next-line import/no-webpack-loader-syntax
// import createDigitGuesser from "workerize-loader!./deepLearning/digitGuesser";
import * as DigitGuesser from "./deepLearning/digitGuesser";


enum AppState {
    DRAWING,
    THINKING,
    CHECKING,
    HAPPY,
    APOLOGY,
}

const RESET_DELAY_MS = 3000;


// const deepWorker = createDigitGuesser<typeof DigitGuesser>();
const deepWorker = DigitGuesser;

function App() {
    const [appState, setAppState] = useState<AppState>(AppState.DRAWING);
    const [checkString, setCheckString] = useState<string>();

    const getGooseState: () => GooseState = () => {
        if (appState === AppState.THINKING)
            return GooseState.THINKING;
        else if (appState === AppState.HAPPY)
            return GooseState.HAPPY;
        return GooseState.IDLE;
    };

    const onQueryCallback = async (canvasInfo: string) => {
        setAppState(AppState.THINKING);
        const canvas = document.getElementsByTagName('canvas')[1] as HTMLCanvasElement;
        // const canvasImg = await .array();
        const outputDigits = await deepWorker.guessDigits(canvasInfo, tf.browser.fromPixels(canvas, 3));
        setAppState(AppState.CHECKING);
        setCheckString(outputDigits);
    };

    useEffect(() => {
        if (appState === AppState.APOLOGY || appState === AppState.HAPPY) {
            let timer = setTimeout(() => setAppState(AppState.DRAWING), RESET_DELAY_MS);
            return () => {
                clearTimeout(timer);
            }
        }
    }, [appState, setAppState])

    const maybeRenderCheckingDialog = () => {
        if (appState !== AppState.CHECKING && appState !== AppState.APOLOGY)
            return;
        return (
            <div>
                <div className="check-div">
                    {
                        appState === AppState.CHECKING &&
                        <span className="check">Is that <span className="bold">"{checkString}"</span>?</span>
                    }
                    {
                        appState === AppState.APOLOGY &&
                        <span className="check">Well, what did you expect? I'm a <span className="bold">Goose</span>...</span>
                    }
                </div>
                { appState === AppState.CHECKING && <div className="button-choices">
                    <button className="guess-button btn btn-2 btn-2h" onClick={() => setAppState(AppState.APOLOGY)}>No</button>
                    <button className="guess-button btn btn-2 btn-2h" onClick={() => setAppState(AppState.HAPPY)}>Yes</button>
                </div> }
            </div>
        );
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Number Guessing Goose</h1>
            </header>
            <GuessingGoose gooseState={getGooseState()}/>
            <CanvasBoard
                onQueryCallback={onQueryCallback}
                disabled={appState === AppState.THINKING}
                hidden={[AppState.CHECKING, AppState.HAPPY, AppState.APOLOGY].indexOf(appState) >= 0}/>
            {maybeRenderCheckingDialog()}
            {/*<canvas id="debug"/>*/}
        </div>
    );
}

export default App;
