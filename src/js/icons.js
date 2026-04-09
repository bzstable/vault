// Consistent 20x20 viewBox, 1.5px stroke, round caps/joins
const s = (d, extra = '') =>
  `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const icons = {
  // ── Categories ──
  food: s('<path d="M7 2v6a3 3 0 006 0V2"/><line x1="10" y1="8" x2="10" y2="18"/><path d="M3 2v4c0 1.7 1.3 3 3 3h1"/>'),
  transport: s('<rect x="2" y="8" width="16" height="7" rx="2"/><circle cx="6" cy="17" r="1.5"/><circle cx="14" cy="17" r="1.5"/><path d="M5 8V5a2 2 0 012-2h6a2 2 0 012 2v3"/>'),
  bills: s('<path d="M3 10l7-7 7 7"/><rect x="5" y="10" width="10" height="8" rx="1"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="10" y1="12" x2="10" y2="16"/>'),
  shopping: s('<path d="M5 5h14l-1.5 7H6.5z"/><circle cx="8" cy="16" r="1.5"/><circle cx="15" cy="16" r="1.5"/><path d="M5 5L4 2H1"/>'),
  entertainment: s('<rect x="3" y="4" width="14" height="12" rx="2"/><polygon points="8,8 8,12 13,10" fill="currentColor" stroke="none"/>'),
  health: s('<path d="M10 18s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" fill="none"/>'),
  education: s('<path d="M2 7l8-4 8 4-8 4z"/><path d="M6 9v4c0 1.7 1.8 3 4 3s4-1.3 4-3V9"/><line x1="18" y1="7" x2="18" y2="13"/>'),
  travel: s('<path d="M15 3l2 2-6 6-3-1-4 4-1-1 4-4-1-3 6-6 2 2 4-3z"/>'),
  savings: s('<circle cx="10" cy="10" r="7"/><path d="M8 10h4"/><path d="M10 8v4"/><path d="M7 3L5 1"/><path d="M13 3l2-2"/>'),
  other: s('<circle cx="10" cy="10" r="1.5"/><circle cx="4" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>'),

  // ── Navigation ──
  dashboard: s('<rect x="2" y="2" width="7" height="7" rx="2"/><rect x="11" y="2" width="7" height="4" rx="2"/><rect x="2" y="11" width="7" height="4" rx="2"/><rect x="11" y="8" width="7" height="7" rx="2" opacity="0.5"/><rect x="2" y="17" width="7" height="1" rx="0.5" opacity="0.3"/>'),
  list: s('<line x1="7" y1="4" x2="17" y2="4"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="7" y1="16" x2="17" y2="16"/><circle cx="3.5" cy="4" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="16" r="1" fill="currentColor" stroke="none"/>'),
  insights: s('<polyline points="2,16 6,10 10,13 14,6 18,9"/><circle cx="18" cy="9" r="1.5" fill="currentColor" stroke="none" opacity="0.5"/>'),
  settings: s('<path d="M10 1c-.4 0-.8.3-.9.7l-.3 1.5c-.5.2-1 .4-1.4.7L6 3.2c-.4-.1-.8 0-1.1.3l-.7.7c-.3.3-.4.7-.3 1.1l.7 1.4c-.3.4-.5.9-.7 1.4l-1.5.3c-.4.1-.7.5-.7.9v1c0 .4.3.8.7.9l1.5.3c.2.5.4 1 .7 1.4l-.7 1.4c-.1.4 0 .8.3 1.1l.7.7c.3.3.7.4 1.1.3l1.4-.7c.4.3.9.5 1.4.7l.3 1.5c.1.4.5.7.9.7h1c.4 0 .8-.3.9-.7l.3-1.5c.5-.2 1-.4 1.4-.7l1.4.7c.4.1.8 0 1.1-.3l.7-.7c.3-.3.4-.7.3-1.1l-.7-1.4c.3-.4.5-.9.7-1.4l1.5-.3c.4-.1.7-.5.7-.9v-1c0-.4-.3-.8-.7-.9l-1.5-.3c-.2-.5-.4-1-.7-1.4l.7-1.4c.1-.4 0-.8-.3-1.1l-.7-.7c-.3-.3-.7-.4-1.1-.3l-1.4.7c-.4-.3-.9-.5-1.4-.7l-.3-1.5C11.8 1.3 11.4 1 11 1h-1z" fill="none"/><circle cx="10.5" cy="10.5" r="2.5" fill="none"/>'),

  // ── Actions ──
  plus: s('<line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/>'),
  edit: s('<path d="M14 2l4 4L7 17H3v-4L14 2z"/>'),
  trash: s('<line x1="3" y1="5" x2="17" y2="5"/><path d="M7 5V3h6v2"/><path d="M5 5l1 12h8l1-12"/><line x1="8" y1="8" x2="8" y2="14"/><line x1="12" y1="8" x2="12" y2="14"/>'),
  search: s('<circle cx="8" cy="8" r="5.5"/><line x1="12.5" y1="12.5" x2="17" y2="17"/>'),
  download: s('<path d="M3 14v3h14v-3"/><path d="M10 3v9"/><path d="M6 8l4 4 4-4"/>'),
  upload: s('<path d="M3 14v3h14v-3"/><path d="M10 12V3"/><path d="M6 7l4-4 4 4"/>'),
  calendar: s('<rect x="3" y="4" width="14" height="13" rx="2"/><line x1="3" y1="9" x2="17" y2="9"/><line x1="7" y1="2" x2="7" y2="6"/><line x1="13" y1="2" x2="13" y2="6"/><circle cx="7" cy="12.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="10" cy="12.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="13" cy="12.5" r="0.8" fill="currentColor" stroke="none"/>'),
  close: s('<line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/>'),
  warning: s('<path d="M10 2L1 18h18L10 2z" fill="none"/><line x1="10" y1="8" x2="10" y2="12"/><circle cx="10" cy="15" r="0.8" fill="currentColor" stroke="none"/>'),
  check: s('<polyline points="4,10 8,14 16,6"/>'),
};

export function icon(name, size = 18) {
  const svg = icons[name] || icons.other;
  return size === 18 ? svg : svg.replace(/width="18"/g, `width="${size}"`).replace(/height="18"/g, `height="${size}"`);
}

export function categoryIcon(catId, size = 18) {
  return icon(catId, size);
}
