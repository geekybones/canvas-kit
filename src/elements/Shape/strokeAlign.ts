export type StrokeAlign = 'inside' | 'center' | 'outside';

export function getStrokeAlignment(strokeAlign?: StrokeAlign): number {
  switch (strokeAlign) {
    case 'inside':
      return 1;
    case 'outside':
      return 0;
    default:
      return 0.5;
  }
}
