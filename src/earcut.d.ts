declare module 'earcut' {
  export default function earcut(
    data: ArrayLike<number>,
    holeIndices?: number[] | null,
    dimensions?: number,
  ): number[];
}
