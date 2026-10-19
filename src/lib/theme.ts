export type ThemeSetting = 'light' | 'dark' | 'system';

const THEME_KEY = 'triplog-theme';

export function getThemeSetting(): ThemeSetting {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

/** Applies the given theme to the document, resolving 'system' against the OS preference. */
export function applyTheme(theme: ThemeSetting) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = theme === 'system' ? 'light dark' : theme;
}

export function setThemeSetting(theme: ThemeSetting) {
  if (theme === 'system') {
    localStorage.removeItem(THEME_KEY);
  } else {
    localStorage.setItem(THEME_KEY, theme);
  }
  applyTheme(theme);
}

/** Re-applies the theme on OS preference changes while the setting is 'system'. */
export function watchSystemTheme() {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => {
    if (getThemeSetting() === 'system') applyTheme('system');
  };
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
