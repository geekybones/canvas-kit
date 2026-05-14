export function makePlaceholderImage(label = 'CanvasKit') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7C5CFF"/>
          <stop offset="100%" stop-color="#0EA5E9"/>
        </linearGradient>
      </defs>
      <rect width="480" height="320" rx="32" fill="#EEF2FF"/>
      <rect x="28" y="28" width="424" height="264" rx="26" fill="url(#g)" opacity="0.14"/>
      <circle cx="112" cy="106" r="34" fill="#7C5CFF" opacity="0.82"/>
      <rect x="178" y="82" width="190" height="24" rx="12" fill="#0F172A" opacity="0.9"/>
      <rect x="178" y="122" width="146" height="18" rx="9" fill="#475569" opacity="0.72"/>
      <rect x="84" y="188" width="312" height="58" rx="20" fill="#FFFFFF" opacity="0.88"/>
      <text x="240" y="226" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" fill="#0F172A">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
