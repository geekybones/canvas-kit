export type AlignmentMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export type AlignmentAccessor = {
  align(mode: AlignmentMode, ids?: readonly string[]): Promise<void>;
};
