import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { PhAlert } from '../alert/alert';
import { PhButton } from '../button/button';

/**
 * Video player (design system: video-player): a lesson video with the browser's native, keyboard-operable controls, named by its
 * title. When the video cannot load it says so with Retry video, so the content around it stays usable.
 */
@Component({
  selector: 'ph-video-player',
  imports: [PhAlert, PhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './video-player.html',
  styleUrl: './video-player.scss',
})
export class PhVideoPlayer {
  /** Where the video streams from; the session cookie travels with it. */
  readonly src = input.required<string>();
  /** The video's title, such as the lesson's name. */
  readonly label = input.required<string>();

  protected readonly failed = signal(false);

  protected retry(): void {
    this.failed.set(false);
  }
}
