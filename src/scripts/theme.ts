export type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme'
const ORDER: Theme[] = ['system', 'light', 'dark']

export const themeLabel: Record<Theme, string> = {
  system: '主题：跟随系统',
  light: '主题：亮色',
  dark: '主题：暗色',
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    /* localStorage unavailable (private mode) — fall through */
  }
  return 'system'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function nextTheme(theme: Theme): Theme {
  return ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
}
