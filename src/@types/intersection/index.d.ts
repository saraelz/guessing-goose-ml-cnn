/// <reference types="node" />

declare module 'intersection' {
  export interface Point {
    x: number,
    y: number
  }
  export interface Segment {
    start: Point,
    end: Point
  }
  interface DescribeI {
    collinear: boolean,
    isParallel: boolean,
    intersection: Point,
  }
  export function describe (a: Segment, b: Segment): DescribeI;
}