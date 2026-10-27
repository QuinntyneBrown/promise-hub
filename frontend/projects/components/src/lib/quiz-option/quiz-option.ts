import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Quiz option (design system: quiz-option): one answer of a quiz question. While taking a quiz it is a label wrapping a native
 * radio or checkbox, so the browser keeps keyboard and screen-reader behaviour; with `review` it is a list item marked correct, wrong
 * or missed, said in words by `note` as well as by colour.
 */
@Component({
  selector: 'ph-quiz-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.role]': "review() ? 'listitem' : null" },
  templateUrl: './quiz-option.html',
  styleUrl: './quiz-option.scss',
})
export class PhQuizOption {
  /** The option's text. */
  readonly label = input.required<string>();
  /** The letter shown before it, such as “A”; decorative. */
  readonly key = input<string>('');
  readonly type = input<'radio' | 'checkbox'>('radio');
  /** The input's name; options of one question share it. */
  readonly name = input<string>('');
  readonly checked = input(false);
  readonly disabled = input(false);
  /** Marks the option in a review instead of offering it. */
  readonly review = input<'correct' | 'wrong' | 'missed' | null>(null);
  /** The words that say what the review mark means, such as “Your answer · correct”. */
  readonly note = input<string | null>(null);
  /** Emits the input's new checked state when the youth changes it. */
  readonly checkedChange = output<boolean>();

  protected changed(event: Event): void {
    this.checkedChange.emit((event.target as HTMLInputElement).checked);
  }
}
