import type { BaseOptions } from '@/core/BaseOptions';
import type { ResizeAxes, StartState } from '@/extensions/interaction/types';

/**
 * Computes the update payload for one element during a resize drag.
 * Returns a partial options object ready to pass directly to el.update().
 */
export function computeResizeUpdate(
  type: string,
  s: StartState,
  axes: ResizeAxes,
  sx: number,
  sy: number,
  ax: number,
  ay: number,
): Partial<BaseOptions> {
  const x = ax + (s.x - ax) * sx;
  const y = ay + (s.y - ay) * sy;
  const dims = computeDims(type, s, axes, sx, sy);
  return { x, y, ...dims } as Partial<BaseOptions>;
}

// ── Per-category dimension helpers ───────────────────────────────────────────

function computeDims(
  type: string,
  s: StartState,
  axes: ResizeAxes,
  sx: number,
  sy: number,
): Record<string, unknown> {
  if (type === 'text') {
    return textDims(s, axes, sx, sy);
  }
  if (type.startsWith('shape:')) {
    return shapeDims(s, axes, sx, sy);
  }
  return scaleDims(s, sx, sy);
}

function textDims(
  s: StartState,
  axes: ResizeAxes,
  sx: number,
  sy: number,
): Record<string, unknown> {
  if (axes.proportional && s.fontSize !== undefined) {
    return {
      fontSize: Math.max(1, s.fontSize * sx),
      // Preserve any prior side-handle scaling so a later corner drag
      // compounds with the current visual transform instead of resetting it.
      scaleX: s.scaleX,
      scaleY: s.scaleY,
    };
  }
  return scaleDims(s, sx, sy);
}

function shapeDims(
  s: StartState,
  axes: ResizeAxes,
  sx: number,
  sy: number,
): Record<string, unknown> {
  if (s.width !== undefined && s.height !== undefined) {
    // Rectangle / Circle / Star — scale each axis independently.
    return {
      ...(axes.xDir !== 0 ? { width: Math.max(1, s.width * sx) } : {}),
      ...(axes.yDir !== 0 ? { height: Math.max(1, s.height * sy) } : {}),
      scaleX: 1,
      scaleY: 1,
    };
  }
  if (s.width !== undefined) {
    // Line — x-handles change length (width), y-handles change thickness (strokeWidth).
    return {
      ...(axes.xDir !== 0 ? { width: Math.max(1, s.width * sx) } : {}),
      ...(axes.yDir !== 0 && s.strokeWidth !== undefined
        ? { strokeWidth: Math.max(0.5, s.strokeWidth * sy) }
        : {}),
      scaleX: 1,
      scaleY: 1,
    };
  }
  if (s.radius !== undefined) {
    // Circle with only radius — scale uniformly.
    const us = Math.sqrt(sx * sy);
    return { radius: Math.max(1, s.radius * us), scaleX: 1, scaleY: 1 };
  }
  // Line or unknown shape — fall back to scale.
  return scaleDims(s, sx, sy);
}

function scaleDims(s: StartState, sx: number, sy: number): Record<string, unknown> {
  return { scaleX: s.scaleX * sx, scaleY: s.scaleY * sy };
}
