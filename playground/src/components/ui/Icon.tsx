import type { ReactNode } from 'react';

export function Icon({
  d,
  size = 16,
  stroke = 1.5,
}: {
  d: unknown;
  size?: number;
  stroke?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {typeof d === 'string' ? <path d={d} /> : (d as ReactNode)}
    </svg>
  );
}
