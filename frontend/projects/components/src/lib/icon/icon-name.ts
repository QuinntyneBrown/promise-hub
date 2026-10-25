/** Stroke paths from the mocks, drawn on a 24×24 grid. */
export const ICONS = {
  today: '<path d="M3 11 12 3l9 8M5 10v10h14V10"/>',
  'check-in':
    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  families:
    '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a6 6 0 0 0-5-6"/>',
  events: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  'quick-cards':
    '<path d="M12 21s-7-4.6-9-9a5 5 0 0 1 9-4 5 5 0 0 1 9 4c-2 4.4-9 9-9 9z"/><path d="M4 12h4l2-3 3 6 2-3h5"/>',
  slips: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  programs: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  messages: '<path d="M4 5h16v11H9l-5 4z"/>',
  reports: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  incidents: '<path d="M5 21V4h12l-2 4 2 4H5"/>',
  attendance:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10M15 10v10"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3.9a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 2.4a7 7 0 0 0-1.7 1L5.1 5.5l-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 1.7 1l.4 2.4h5l.4-2.4a7 7 0 0 0 1.7-1l2.3.9 2-3.4-2-1.5c.1-.3.1-.7.1-1z"/>',
  notifications: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  'sign-out': '<path d="M9 21H5V3h4M15 17l5-5-5-5M20 12H9"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  warning: '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
  offline:
    '<path d="M2 2l20 20M5 12.5a11 11 0 0 1 4-2.6M2 8.8A16 16 0 0 1 7.4 5M12 20h.01M8.5 16a5 5 0 0 1 7 0M15 12.5a11 11 0 0 1 4 2.6M22 8.8a16 16 0 0 0-8.5-4.3"/>',
  maintenance: '<path d="M14.7 6.3a4 4 0 0 0 5 5L9 22l-3-3L16.7 8.3a4 4 0 0 1-2-2z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>',
  'arrow-right': '<path d="M5 12h14m0 0-6-6m6 6-6 6"/>',
  upload: '<path d="M12 15V3m0 0-4 4m4-4 4 4M4 17v3h16v-3"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off':
    '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
} as const;

export type IconName = keyof typeof ICONS;
