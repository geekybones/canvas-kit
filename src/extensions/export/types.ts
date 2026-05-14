export type ExportMode = 'content' | 'viewport';
export type ExportQuality = 'standard' | 'hd' | 'ultra';

export type ExportOptions = {
  mode?: ExportMode;
  margin?: number;
  quality?: ExportQuality;
  resolution?: number;
  antialias?: boolean;
  backgroundColor?: string;
};

export type ExportAccessor = {
  render(format: 'png' | 'base64', options?: ExportOptions): Promise<Blob | string>;
};
