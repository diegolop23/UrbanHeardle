export const THEMES = [
  { id: 'green-dark',   label: 'Green',   accent: '#39FF14', mode: 'dark'  },
  { id: 'green-light',  label: 'Green',   accent: '#1a8c00', mode: 'light' },
  { id: 'orange-dark',  label: 'Orange',  accent: '#FF7A00', mode: 'dark'  },
  { id: 'orange-light', label: 'Orange',  accent: '#c25a00', mode: 'light' },
  { id: 'yellow-dark',  label: 'Yellow',  accent: '#FFD700', mode: 'dark'  },
  { id: 'yellow-light', label: 'Yellow',  accent: '#b89a00', mode: 'light' },
  { id: 'purple-dark',  label: 'Purple',  accent: '#BF5FFF', mode: 'dark'  },
  { id: 'purple-light', label: 'Purple',  accent: '#7c2dcc', mode: 'light' },
  { id: 'pink-dark',    label: 'Pink',    accent: '#FF4FA3', mode: 'dark'  },
  { id: 'pink-light',   label: 'Pink',    accent: '#c4006b', mode: 'light' },
  { id: 'blue-dark',    label: 'Blue',    accent: '#00B4FF', mode: 'dark'  },
  { id: 'blue-light',   label: 'Blue',    accent: '#005f99', mode: 'light' },
];

const STORAGE_KEY = 'urbanheardle-theme';
const DEFAULT_THEME = 'green-dark';

export function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME;
}

export function applyTheme(themeId) {
  const valid = THEMES.find(t => t.id === themeId) ? themeId : DEFAULT_THEME;
  document.documentElement.setAttribute('data-theme', valid);
  localStorage.setItem(STORAGE_KEY, valid);
}

export function initTheme() {
  applyTheme(getSavedTheme());
}
