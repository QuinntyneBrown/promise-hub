/** A person's display preferences (L2-119, L2-120): kept with them and applied to every page they open. */
export interface DisplayPreferences {
  theme: 'system' | 'light' | 'dark';
  textSize: 'default' | 'large' | 'larger';
  reduceMotion: boolean;
}
