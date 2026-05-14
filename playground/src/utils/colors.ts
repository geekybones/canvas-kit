const JSON_COLOR_KEYS = new Set(['background', 'backgroundColor', 'fill', 'stroke', 'tint']);

export function colorToHex(color: unknown, fallback = '#111827') {
  if (typeof color === 'string') {
    return color.startsWith('#') ? color.toUpperCase() : fallback;
  }

  if (typeof color === 'number' && Number.isFinite(color)) {
    return `#${(color & 0xffffff).toString(16).padStart(6, '0')}`.toUpperCase();
  }

  return fallback;
}

export function hexToNumber(value: string, fallback = 0x111827) {
  const normalized = value.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return fallback;
  }

  return Number.parseInt(normalized, 16);
}

function normalizeHexString(value: string) {
  const normalized = value.trim();

  if (!normalized.startsWith('#')) {
    return null;
  }

  const body = normalized.slice(1);
  if (/^[0-9a-fA-F]{6}$/.test(body)) {
    return `#${body.toUpperCase()}`;
  }

  return null;
}

function mapJsonColors(value: unknown, mapper: (color: unknown) => unknown, key = ''): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => mapJsonColors(item, mapper));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        mapJsonColors(entryValue, mapper, entryKey),
      ]),
    );
  }

  if (JSON_COLOR_KEYS.has(key)) {
    return mapper(value);
  }

  return value;
}

export function formatJsonColors(value: unknown) {
  return mapJsonColors(value, (color) => {
    if (typeof color === 'number' && Number.isFinite(color)) {
      return colorToHex(color);
    }
    return color;
  });
}

export function parseJsonColors(value: unknown) {
  return mapJsonColors(value, (color) => {
    if (typeof color === 'string') {
      const normalized = normalizeHexString(color);
      if (normalized) {
        return hexToNumber(normalized);
      }
    }
    return color;
  });
}
