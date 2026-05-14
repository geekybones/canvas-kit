import { Shader } from 'pixi.js';

function normalizeFillNumber(fill: number | string): number {
  if (typeof fill === 'number') {
    return fill;
  }

  let value = fill.trim();

  if (value.startsWith('#')) {
    value = value.slice(1);
  }

  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const parsed = parseInt(value, 16);

  return Number.isNaN(parsed) ? 0x000000 : parsed;
}

function fillToGLSLColor(fill: number | string, alpha = 1): string {
  const hex = normalizeFillNumber(fill);

  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  const a = Math.max(0, Math.min(1, alpha));

  return `vec4(${r.toFixed(6)}, ${g.toFixed(6)}, ${b.toFixed(6)}, ${a.toFixed(6)})`;
}

export function createSolidColorShader(fill: number | string, alpha = 1): Shader {
  const glslColor = fillToGLSLColor(fill, alpha);

  const shader = Shader.from({
    gl: {
      vertex: `
        attribute vec2 aPosition;
        attribute vec2 aUV;

        uniform mat3 uProjectionMatrix;
        uniform mat3 uWorldTransformMatrix;
        uniform mat3 uTransformMatrix;
        varying vec2 vUV;

        void main() {
          mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
          vec3 position = mvp * vec3(aPosition, 1.0);
          vUV = aUV;

          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragment: `
        precision mediump float;
        varying vec2 vUV;

        void main() {
          gl_FragColor = ${glslColor} + vec4(vUV * 0.0, 0.0, 0.0);
        }
      `,
    },
  });

  return shader as Shader;
}
