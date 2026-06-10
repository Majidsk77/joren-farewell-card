export const THEMES = {
  warm: {
    label: "Warm Cream",
    bg: "#FFFBF0",
    accent: "#C97D7D",
    tape: "rgba(255,220,100,0.68)",
  },
  blush: {
    label: "Blush Pink",
    bg: "#FFF0F5",
    accent: "#C97D7D",
    tape: "rgba(255,175,190,0.68)",
  },
  sage: {
    label: "Sage Green",
    bg: "#F5FFF0",
    accent: "#5E8A5E",
    tape: "rgba(170,220,200,0.68)",
  },
  lavender: {
    label: "Lavender",
    bg: "#F8F0FF",
    accent: "#8A6EC9",
    tape: "rgba(200,178,255,0.68)",
  },
  sky: {
    label: "Sky Blue",
    bg: "#F0FBFF",
    accent: "#5E8AAA",
    tape: "rgba(160,215,245,0.68)",
  },
  sunny: {
    label: "Sunny",
    bg: "#FFF8E7",
    accent: "#C9A85E",
    tape: "rgba(255,205,160,0.68)",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;
export const DEFAULT_THEME: ThemeKey = "warm";

export function getTheme(key: string) {
  return THEMES[key as ThemeKey] ?? THEMES.warm;
}
