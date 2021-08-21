import * as tf from '@tensorflow/tfjs';
import yeet from './yeet';
import {Tensor2D, Tensor3D} from "@tensorflow/tfjs";

export async function testWordGuesser(canvasString: string) {
    console.log(canvasString);
    return new Promise<string>((resolve, reject) => {
        setTimeout(() => {
            resolve('Ahmed');
        }, 1000);
    });
}


interface CanvasCoords {
    lines: CanvasCoordsLine[]
}

interface CanvasCoordsLine {
    points: CanvasCoordsPoint[]
}

interface CanvasCoordsPoint {
    x: number,
    y: number
}


function getCanvasCoordsBounds(canvasCoords: CanvasCoords) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let line of canvasCoords.lines) {
        for (let pt of line.points) {
            if (minX > pt.x)
                minX = pt.x;
            if (maxX < pt.x)
                maxX = pt.x;
            if (minY > pt.y)
                minY = pt.y;
            if (maxY < pt.y)
                maxY = pt.y;
        }
    }
    return [Math.floor(minX), Math.ceil(maxX), Math.floor(minY), Math.ceil(maxY)];
}

const REQ_H = 64;
const REQ_W = 256;

/**
 * Takes an image where 0 is blank and 255 is blackish.
 * Returns an image from 0 to 1 where 0 is black and 1 is white.
 */
function normalizeImg(img: tf.Tensor2D) {
    const imgScaled = tf.scalar(255).div(img.max()).mul(img);
    const imgZeroToOne = tf.scalar(255).sub(imgScaled).div(255);
    return tf.minimum(tf.maximum(tf.scalar(0), imgZeroToOne), 1);
}

async function preprocess(img: tf.Tensor3D) {
    // resize img to be 256x64 (wxh)
    const PAD = 20;
    img = img.pad([[PAD, PAD], [PAD, PAD], [0, 0]]);
    let ratio = Math.max(img.shape[0] / REQ_H, img.shape[1] / REQ_W);
    if (ratio > 1) {
        img = tf.image.resizeBilinear(
            img,
            [Math.floor(img.shape[0] / ratio), Math.floor(img.shape[1] / ratio)]
        );
    }

    let img2D = normalizeImg(img.mean(2)) as Tensor2D;

    // invert from mostly 0 to mostly 255 for empty spaces
    img2D = img2D.pad([[0, REQ_H - img2D.shape[0]], [0, REQ_W - img2D.shape[1]]], 1);

    // Rotate clockwise 90 degrees
    img2D = tf.reverse(tf.transpose(img2D), [1]);
    // make the max value the most black
    return img2D;
}

function imgFromCanvas(canvas: HTMLCanvasElement, canvasString: string) {
    const canvasCoords = JSON.parse(canvasString);
    const pxs = tf.browser.fromPixels(canvas, 3);
    const [minX, maxX, minY, maxY] = getCanvasCoordsBounds(canvasCoords);
    return pxs.slice(
        [minY, minX, 0],
        [(maxY - minY), (maxX - minX), 3]
    );
}

const VOCAB = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-' ";

/**
 * This is an array of arrays.
 * outer array: time steps. Length: 64 due to model
 * inner array: probabilities. Length: 30 due to alphabet's vocab (see VOCAB). The last index (29) is <NULL>.
 */
async function greedyCtcDecoder(ctcProbabilities: Tensor2D) {
    // Every number is a letter based on it's index in vocab.
    // This is a 1D tensor with the idxs that have the highest probabilities
    const maxIdxsPerStep = await ctcProbabilities.argMax(1).data();
    // Let's say we have MMMA--RR--TTT-IN. We want MARTIN (excluding NULL dashes).
    const greedyOutput: number[] = [maxIdxsPerStep[0]];
    for (let i = 1; i < maxIdxsPerStep.length; i++) {
        const currLetterIdx = maxIdxsPerStep[i];
        const prevLetterIdx = maxIdxsPerStep[i-1];
        if (currLetterIdx !== prevLetterIdx && currLetterIdx < VOCAB.length) {
            greedyOutput.push(maxIdxsPerStep[i]);
        }
    }
    return greedyOutput.map(i => VOCAB[i]).join('');
}



let model: tf.GraphModel | undefined;

export async function wordGuesser(canvasString: string) {
    if (!model) {
        model = await tf.loadGraphModel('/model.json');
    }
    const canvas = document.getElementsByTagName('canvas')[1];
    const partialPxs = imgFromCanvas(canvas, canvasString);
    const neuralNetworkImg2D = await preprocess(partialPxs);

    const el = document.getElementById("bestCanvas") as HTMLCanvasElement;
    console.log(neuralNetworkImg2D.shape, '?');
    tf.browser.toPixels(neuralNetworkImg2D.div(255) as Tensor3D, el);
    const img = tf.tensor3d(yeet.map(l => l.map(el => [el, el, el])), [256, 64, 3]);
    const canvasA = document.getElementById("bestCanvas") as HTMLCanvasElement;
    const canvasB = document.getElementById("worstCanvas") as HTMLCanvasElement;
    const num = await neuralNetworkImg2D.array() as number[][];
    const wow = tf.tensor3d(num.map(l => l.map(el => [el, el, el])));
    tf.browser.toPixels(img, canvasA);
    tf.browser.toPixels(wow, canvasB);

    console.log(neuralNetworkImg2D.shape);

    // // @ts-ignore
    // window.tf = tf;
    // // @ts-ignore
    // window.img = img;
    // // @ts-ignore
    // window.nn = neuralNetworkImg2D;

    const image = tf.tensor2d(yeet, [256, 64]).reshape([1, 256, 64, 1]);
    console.log(image.shape);
    const predictionProbs = await model.executeAsync(neuralNetworkImg2D.reshape([1, REQ_W, REQ_H, 1])) as tf.Tensor3D;
    // convert from [1, 64, 30] to [64, 30]
    const predictionString = await greedyCtcDecoder(
        predictionProbs.reshape([predictionProbs.shape[1], predictionProbs.shape[2]])
    );
    return predictionString;
}