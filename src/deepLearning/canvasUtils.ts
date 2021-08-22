import DisjoinedSet from "./disjointedSet";
import intersection, {Segment} from 'intersection';


export interface CanvasCoords {
    lines: CanvasCoordsLine[]
}

interface CanvasCoordsLine {
    points: CanvasCoordsPoint[]
}

interface CanvasCoordsPoint {
    x: number,
    y: number
}

export class Rect {
    constructor(public minX: number, public minY: number, public maxX: number, public maxY: number) {}

    private overlap(startA: number, startB: number, endA: number, endB: number) {
        if ((startA <= endB) && (endA >= startB)) {
            return Math.max(endB - startA, endA - startB);
        }
        return null;
    }

    overlapX(other: Rect) {
        return this.overlap(this.minX, other.minX, this.maxX, other.maxX);
    }

    overlapY(other: Rect) {
        return this.overlap(this.minY, other.minY, this.maxY, other.maxY);
    }

    intersects(other: Rect) {
        return this.overlapY(other) !== null && this.overlapX(other) !== null;
    }

    public static combine(rects: Rect[]) {
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        for (let r of rects) {
            if (minX > r.minX)
                minX = r.minX;
            if (minX > r.maxX)
                minX = r.maxX;

            if (maxX < r.minX)
                maxX = r.minX;
            if (maxX < r.maxX)
                maxX = r.maxX;

            if (minY > r.minY)
                minY = r.minY;
            if (minY > r.maxY)
                minY = r.maxY;

            if (maxY < r.minY)
                maxY = r.minY;
            if (maxY < r.maxY)
                maxY = r.maxY;
        }
        return new Rect(Math.floor(minX), Math.floor(minY), Math.ceil(maxX), Math.ceil(maxY));
    }
}

function getCanvasCoordsBounds(line: CanvasCoordsLine) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
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
    return new Rect(Math.floor(minX), Math.floor(minY), Math.ceil(maxX), Math.ceil(maxY));
}

function shouldBePaired(rectA: Rect, segmentsA: Segment[], rectB: Rect, segmentsB: Segment[]): boolean {
    if (rectA.intersects(rectB)) {
        for (let sa of segmentsA) {
            for (let sb of segmentsB) {
                const i = intersection.describe(sa, sb);
                if (i.intersection !== undefined || i.collinear) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function groupCanvasRects(canvasCoords: CanvasCoords): Rect[] {
    const bounds = canvasCoords.lines.map(l => {
        const segments: Segment[] = [];
        for (let i = 1; i < l.points.length; i++) {
            segments.push({start: l.points[i - 1], end: l.points[i]});
        }
        return {
            segments: segments,
            rect: getCanvasCoordsBounds(l),
        };
    });
    // sort based off of X
    bounds.sort((a, b) => a.rect.minX - b.rect.minX);
    const unions = new DisjoinedSet(bounds.length);

    for (let i = 0; i < bounds.length; i++) {
        for (let j = i + 1; j < bounds.length; j++) {
            if (i === j)
                continue;
            if (shouldBePaired(bounds[i].rect, bounds[i].segments, bounds[j].rect, bounds[j].segments)) {
                unions.connect(i, j);
            }
        }
    }
    const groups = unions.getDisjoinetedGroups();
    return groups.map(l => Rect.combine(l.map(i => bounds[i].rect)));
}
