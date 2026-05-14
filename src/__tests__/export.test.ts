import { describe, expect, it, vi } from 'vitest';

import type { CanvasContext } from '@/core/CanvasContext';
import { createExportAccessor } from '@/extensions/export/accessor';
import { ExportManager } from '@/extensions/export/ExportManager';

function makeCtx(overrides?: {
  canvas?: HTMLCanvasElement;
  interaction?: { setOverlayVisible(visible: boolean): void };
  elements?: Array<{
    visible?: boolean;
    bounds: { x: number; y: number; width: number; height: number };
  }>;
}) {
  const canvas =
    overrides?.canvas ??
    Object.assign(document.createElement('canvas'), {
      toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
      toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' }))),
    });

  const interaction = overrides?.interaction ?? {
    setOverlayVisible: vi.fn(),
  };
  const extractCanvas = vi.fn(() => canvas);
  const stage = {};
  const elements = overrides?.elements ?? [
    {
      bounds: { x: 10, y: 20, width: 100, height: 50 },
    },
  ];

  const ctx = {
    options: {
      backgroundColor: '#f4f5f7',
    },
    app: {
      getPixiApp: () => ({
        stage,
        screen: { width: 800, height: 600 },
        renderer: {
          extract: {
            canvas: extractCanvas,
          },
        },
      }),
    },
    registry: {
      getAll: () =>
        new Map(
          elements.map((element, index) => [
            String(index),
            {
              getOptions: () => ({ visible: element.visible }),
              getDisplayObject: () => ({
                getBounds: () => element.bounds,
              }),
            },
          ]),
        ),
    },
    getExtension: vi.fn((name: string) => {
      if (name === 'interaction') return interaction;
      return undefined;
    }),
    clearElements: vi.fn(),
  } as unknown as CanvasContext;

  return { ctx, canvas, extractCanvas, interaction, stage };
}

describe('ExportManager', () => {
  it('renders base64 output', async () => {
    const { ctx, canvas, extractCanvas, interaction, stage } = makeCtx();
    const exportManager = new ExportManager();
    exportManager.init(ctx);

    const result = await exportManager.render('base64');

    expect(result).toBe('data:image/png;base64,mock');
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/png');
    expect(extractCanvas).toHaveBeenCalledWith(
      expect.objectContaining({
        target: stage,
        resolution: 1,
        clearColor: '#f4f5f7',
        antialias: true,
      }),
    );
    expect(interaction.setOverlayVisible).toHaveBeenNthCalledWith(1, false);
    expect(interaction.setOverlayVisible).toHaveBeenNthCalledWith(2, true);
  });

  it('renders png output', async () => {
    const { ctx, canvas, interaction } = makeCtx();
    const exportManager = new ExportManager();
    exportManager.init(ctx);

    const result = await exportManager.render('png');

    expect(result).toBeInstanceOf(Blob);
    expect(canvas.toBlob).toHaveBeenCalled();
    expect(interaction.setOverlayVisible).toHaveBeenNthCalledWith(1, false);
    expect(interaction.setOverlayVisible).toHaveBeenNthCalledWith(2, true);
  });

  it('exports content with margin and resolution options', async () => {
    const { ctx, extractCanvas } = makeCtx({
      elements: [
        { bounds: { x: 10.4, y: 20.2, width: 100, height: 50 } },
        { bounds: { x: 150, y: 5, width: 20.1, height: 25.6 } },
      ],
    });
    const exportManager = new ExportManager();
    exportManager.init(ctx);

    await exportManager.render('png', { margin: 24, resolution: 2 });

    expect(extractCanvas).toHaveBeenCalledWith(
      expect.objectContaining({
        resolution: 2,
        frame: expect.objectContaining({
          x: -14,
          y: -19,
          width: 209,
          height: 114,
        }),
      }),
    );
  });

  it('can export the current viewport size', async () => {
    const { ctx, extractCanvas } = makeCtx();
    const exportManager = new ExportManager();
    exportManager.init(ctx);

    await exportManager.render('png', { mode: 'viewport', resolution: 2 });

    expect(extractCanvas).toHaveBeenCalledWith(
      expect.objectContaining({
        resolution: 2,
        frame: expect.objectContaining({
          x: 0,
          y: 0,
          width: 800,
          height: 600,
        }),
      }),
    );
  });

  it('supports named export quality and antialias options', async () => {
    const { ctx, extractCanvas } = makeCtx();
    const exportManager = new ExportManager();
    exportManager.init(ctx);

    await exportManager.render('png', { quality: 'ultra', antialias: false });

    expect(extractCanvas).toHaveBeenCalledWith(
      expect.objectContaining({
        resolution: 3,
        antialias: false,
      }),
    );
  });

  it('lets explicit resolution override named quality', async () => {
    const { ctx, extractCanvas } = makeCtx();
    const exportManager = new ExportManager();
    exportManager.init(ctx);

    await exportManager.render('png', { quality: 'ultra', resolution: 2 });

    expect(extractCanvas).toHaveBeenCalledWith(
      expect.objectContaining({
        resolution: 2,
      }),
    );
  });

  it('restores overlay visibility if png export fails', async () => {
    const failingCanvas = Object.assign(document.createElement('canvas'), {
      toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
      toBlob: vi.fn((callback: BlobCallback) => callback(null)),
    });
    const interaction = { setOverlayVisible: vi.fn() };
    const { ctx } = makeCtx({ canvas: failingCanvas, interaction });
    const exportManager = new ExportManager();
    exportManager.init(ctx);

    await expect(exportManager.render('png')).rejects.toThrow('Failed to export PNG');
    expect(interaction.setOverlayVisible).toHaveBeenNthCalledWith(1, false);
    expect(interaction.setOverlayVisible).toHaveBeenNthCalledWith(2, true);
  });
});

describe('createExportAccessor', () => {
  it('throws when export extension is unavailable', async () => {
    const accessor = createExportAccessor(() => undefined);

    await expect(accessor.render('png')).rejects.toThrow('Export extension is disabled');
  });
});
