import * as tf from '@tensorflow/tfjs';
import {CanvasCoords, groupCanvasRects} from "./canvasUtils";


const REQ_H = 28;
const REQ_W = 28;

/**
 * Makes the darkest color absolute dark. Returns an image between [0, 1] inclusively.
 * Takes an image where 0 is blank and 255 is blackish.
 * Returns an image where 0 is blank and 1 is black.
 */
function normalizeImg(img: tf.Tensor2D) {
    const imgScaled = tf.scalar(255).div(img.max()).mul(img);
    const imgZeroToOne = imgScaled.div(255);
    return tf.minimum(tf.maximum(tf.scalar(0), imgZeroToOne), 1);
}


const PAD = 16;

function preprocess(img: tf.Tensor3D) {
    // resize img to be 256x64 (wxh)
    img = img.pad([[PAD, PAD], [PAD, PAD], [0, 0]]);
    let ratio = Math.max(img.shape[0] / REQ_H, img.shape[1] / REQ_W);
    if (ratio > 1) {
        img = tf.image.resizeBilinear(
            img,
            [Math.floor(img.shape[0] / ratio), Math.floor(img.shape[1] / ratio)]
        );
    }

    let img2D = normalizeImg(img.mean(2)) as tf.Tensor2D;

    // Pad out the width or height to be the required image size
    img2D = img2D.pad([[0, REQ_H - img2D.shape[0]], [0, REQ_W - img2D.shape[1]]], 0);
    return img2D;
}

function imagesFromCanvas(canvasString: string, pxs: tf.Tensor3D): tf.Tensor3D[] {
    const canvasCoords = JSON.parse(canvasString) as CanvasCoords;
    const canvasRects = groupCanvasRects(canvasCoords);
    return canvasRects.map(r => {
        const minX = Math.max(0, r.minX);
        const minY = Math.max(0, r.minY);
        const maxX = Math.min(pxs.shape[1], r.maxX);
        const maxY = Math.min(pxs.shape[0], r.maxY);
        return pxs.slice(
            [minY, minX, 0],
            [(maxY - minY), (maxX - minX), 3]
        );
    });
}

let model: tf.GraphModel | undefined;

// async function rendererToDebugCanvas(neuralNetworkImg2D: tf.Tensor2D[]) {
//     const arrs = await Promise.all(neuralNetworkImg2D.map(t => t.array()));
//     const t3 = arrs.map(a => tf.tensor3d(a.map(l => l.map(pxl => [pxl, pxl, pxl]))));
//     console.log(arrs.length);
//     const c = document.getElementById('debug') as HTMLCanvasElement;
//     for (let t of t3) {
//         tf.browser.toPixels(t, c);
//     }
// }

export async function guessDigits(canvasString: string, canvasImg: number[][][]) {
    if (!model) {
        model = await tf.loadGraphModel('/model.json');
    }
    const neuralNetworkImg2D = imagesFromCanvas(canvasString, tf.tensor3d(canvasImg)).map(preprocess);
    const neuralNetworkImg3D = neuralNetworkImg2D.map(t => t.expandDims(-1)); // convert 28x28 -> 28x28x1
    const neuralNetworkImg4D = tf.stack(neuralNetworkImg3D);
    const predictionProbs = await model.predict(neuralNetworkImg4D) as tf.Tensor2D;
    const predictions = await predictionProbs.argMax(1).array() as number[];
    return predictions.join('');
}