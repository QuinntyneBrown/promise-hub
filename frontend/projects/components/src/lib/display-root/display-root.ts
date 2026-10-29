import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { DisplaySettings } from './display-settings';

/**
 * Sets the design-system hooks on `<html>` (tokens.css): `data-theme` for Light or Dark, `data-text-size` for Large or Larger and
 * `data-motion="reduce"`. System, Default and motion on remove the attribute so the device's own preference applies. No HTTP.
 */
@Injectable({ providedIn: 'root' })
export class PhDisplayRoot {
  private readonly root = inject(DOCUMENT).documentElement;

  apply(settings: DisplaySettings): void {
    this.set('data-theme', settings.theme === 'system' ? null : settings.theme);
    this.set('data-text-size', settings.textSize === 'default' ? null : settings.textSize);
    this.set('data-motion', settings.reduceMotion ? 'reduce' : null);
  }

  /** Back to the device's preferences, as on signed-out pages. */
  reset(): void {
    this.apply({ theme: 'system', textSize: 'default', reduceMotion: false });
  }

  private set(name: string, value: string | null): void {
    if (value === null) this.root.removeAttribute(name);
    else this.root.setAttribute(name, value);
  }
}
