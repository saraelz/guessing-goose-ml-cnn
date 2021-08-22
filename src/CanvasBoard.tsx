import CanvasDraw from "react-canvas-draw";
import React, {useRef} from "react";
import "./CanvasBoard.css";

export interface CanvasBoardProps {
    onQueryCallback: (drawing: string) => void;
    disabled: boolean;
    hidden: boolean;
}


export default function CanvasBoard(props: CanvasBoardProps) {
    const canvasDrawEl = useRef<CanvasDraw>(null);
    const clearCanvas = () => {
        if (canvasDrawEl && canvasDrawEl.current) {
            canvasDrawEl.current!.clear();
        }
    };
    const submitCanvas = () => {
        if (canvasDrawEl && canvasDrawEl.current) {
            props.onQueryCallback(canvasDrawEl.current.getSaveData());
        }
    }
    return (
        <section>
            <div className="drawing-container">
                <CanvasDraw
                    className="drawing-pad"
                    brushRadius={4}
                    lazyRadius={4}
                    hideGrid={true}
                    canvasWidth={"40em"}
                    canvasHeight={"10em"}
                    ref={canvasDrawEl}
                    disabled={props.disabled}
                />
            </div>
            {!props.hidden && (
                <div className="button-choices">
                    <button className="guess-button btn btn-2 btn-2h" onClick={clearCanvas} disabled={props.disabled}>clear</button>
                    <button className="guess-button btn btn-2 btn-2h" onClick={submitCanvas} disabled={props.disabled}>Guess Number</button>
                </div>
            )}
        </section>
    );
}

