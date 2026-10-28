/** What the document root shows: a theme, a text size and whether motion is reduced (design system: theming, motion). */
export interface DisplaySettings {
  theme: 'system' | 'light' | 'dark';
  textSize: 'default' | 'large' | 'larger';
  reduceMotion: boolean;
}
