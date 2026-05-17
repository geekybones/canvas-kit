export const ICONS = {
  rect: 'M4 5h16v14H4z',
  ellipse: <ellipse cx="12" cy="12" rx="8" ry="6" />,
  text: 'M5 5h14M12 5v14M9 19h6',
  image: (
    <g>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <circle cx="9" cy="11" r="1.5" />
      <path d="M21 17l-5-5-7 7" />
    </g>
  ),
  undo: 'M9 14l-5-5 5-5M4 9h11a5 5 0 010 10h-3',
  redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3',
  chevDown: 'M6 9l6 6 6-6',
  eye: (
    <g>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  eyeOff: (
    <g>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a2 2 0 102.8 2.8" />
      <path d="M9.9 5.2A10.7 10.7 0 0112 5c6.5 0 10 7 10 7a18.3 18.3 0 01-4.2 4.9" />
      <path d="M6.6 6.7C3.8 8.6 2 12 2 12a18 18 0 004.7 5.2" />
    </g>
  ),
  layerFrame: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  bold: 'M7 5h6a3.5 3.5 0 010 7H7zM7 12h7a3.5 3.5 0 010 7H7z',
  italic: 'M10 5h8M6 19h8M14 5l-4 14',
  underline: 'M7 5v7a5 5 0 0010 0V5M5 21h14',
  strikethrough: 'M5 12h14M7 5v3M17 16v3',
  alignL: 'M4 6h16M4 12h10M4 18h16',
  alignC: 'M4 6h16M7 12h10M4 18h16',
  alignR: 'M4 6h16M10 12h10M4 18h16',
  alignJ: 'M4 6h16M4 12h16M4 18h16',
  alignObjLeft: (
    <g>
      <path d="M5 4v16" />
      <rect x="7" y="6" width="8" height="4" rx="1" />
      <rect x="7" y="14" width="12" height="4" rx="1" />
    </g>
  ),
  alignObjCenter: (
    <g>
      <path d="M12 4v16" />
      <rect x="8" y="6" width="8" height="4" rx="1" />
      <rect x="6" y="14" width="12" height="4" rx="1" />
    </g>
  ),
  alignObjRight: (
    <g>
      <path d="M19 4v16" />
      <rect x="9" y="6" width="8" height="4" rx="1" />
      <rect x="5" y="14" width="12" height="4" rx="1" />
    </g>
  ),
  alignObjTop: (
    <g>
      <path d="M4 5h16" />
      <rect x="6" y="7" width="4" height="8" rx="1" />
      <rect x="14" y="7" width="4" height="12" rx="1" />
    </g>
  ),
  alignObjMiddle: (
    <g>
      <path d="M4 12h16" />
      <rect x="6" y="8" width="4" height="8" rx="1" />
      <rect x="14" y="6" width="4" height="12" rx="1" />
    </g>
  ),
  alignObjBottom: (
    <g>
      <path d="M4 19h16" />
      <rect x="6" y="9" width="4" height="8" rx="1" />
      <rect x="14" y="5" width="4" height="12" rx="1" />
    </g>
  ),
  upload: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  line: 'M4 20L20 4',
  trash: 'M3 6h18M8 6V4h8v2M7 6l1 14h8l1-14M10 10v6M14 10v6',
  keyboard:
    'M5 6h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm2 3h1.5m3 0H13m-5 3h1.5m3 0H13m-5 3H16',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 12V3M20 21v-5M20 14V3',
  github:
    'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  externalLink: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
};
