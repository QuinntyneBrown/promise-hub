import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  GatedResult,
  LEARNING_API,
  Reflection,
  ReflectionEditor,
  ReflectionSaveResult,
} from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhErrorSummary,
  PhList,
  PhListItem,
  PhPageHeader,
  PhRadioGroup,
  PhSkeleton,
  PhSwitch,
  PhTextarea,
  RadioOption,
  ToastService,
  formatDateTime,
} from '@promisehub/components';
import { Subject, startWith, switchMap, tap } from 'rxjs';

/** The server's field names and the ids of the fields on the page, for the error summary's links. */
const FIELD: Record<string, string> = { mood: 'mood', text: 'reflection', action: 'action' };

const MOODS: RadioOption[] = [
  { value: 'Hopeful', label: 'Hopeful', hint: 'Ready to try it' },
  { value: 'Thoughtful', label: 'Thoughtful', hint: 'Still thinking it over' },
  { value: 'Unsure', label: 'Unsure', hint: 'Not sure what it means for me' },
  { value: 'Challenged', label: 'Challenged', hint: 'It pushed me' },
];

/**
 * Your reflection on a lesson (mock: learn-reflection, L2-089 criteria 1 to 3 and 7): how she feels, her words, one thing she'll do and
 * whether her mentor may read it, checked here as the server checks them, then saved. Private unless she turns sharing on.
 */
@Component({
  selector: 'ph-reflection-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorSummary,
    PhList,
    PhListItem,
    PhPageHeader,
    PhRadioGroup,
    PhSkeleton,
    PhSwitch,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reflection-page.html',
  styleUrl: './reflection-page.css',
})
export class ReflectionPage {
  private readonly api = inject(LEARNING_API);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();
  protected readonly moods = MOODS;

  /** Route parameter: the lesson. */
  readonly id = input.required<string>();

  protected readonly mood = signal('');
  protected readonly text = signal('');
  protected readonly action = signal('');
  protected readonly shared = signal(false);
  protected readonly saving = signal(false);
  protected readonly failed = signal(false);
  /** The reflection as last saved on the server, while its confirmation shows. */
  protected readonly saved = signal<Reflection | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({
      field: FIELD[key] ?? key,
      message,
    })),
  );

  /** Null while loading. */
  protected readonly result = toSignal<GatedResult<ReflectionEditor> | null>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.reflection(id).pipe(
              tap((r) => {
                if (r.status === 'loaded') this.fill(r.value.reflection);
              }),
              startWith<GatedResult<ReflectionEditor> | null>(null),
            ),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  private fill(r: Reflection | null): void {
    this.mood.set(r?.mood ?? '');
    this.text.set(r?.text ?? '');
    this.action.set(r?.action ?? '');
    this.shared.set(r?.shared ?? false);
  }

  protected mentor(v: ReflectionEditor): string {
    return v.mentorName ?? 'your mentor';
  }

  protected shareLabel(v: ReflectionEditor): string {
    return v.mentorName ? `Share with my mentor, ${v.mentorName}` : 'Share with my mentor';
  }

  protected shareText(v: ReflectionEditor): string {
    return this.shared()
      ? `${this.mentor(v)} can read it once you save it, and talk about it with you in check-ins.`
      : `Off: only you can see it. Turn it on to let ${this.mentor(v)} read it.`;
  }

  protected savedText(v: ReflectionEditor, r: Reflection): string {
    const when = `Saved ${formatDateTime(r.savedAt)}.`;
    return r.shared ? `${this.mentor(v)} can read it. ${when}` : `Only you can see it. ${when}`;
  }

  /** The checks the server makes, so she sees every problem at once. */
  private check(): Record<string, string> {
    const errors: Record<string, string> = {};
    const text = this.text().trim();
    if (!this.mood()) errors['mood'] = 'Choose how you’re feeling.';
    if (!text) errors['text'] = 'Write your reflection.';
    else if (text.length > 5000) errors['text'] = 'Keep your reflection under 5,000 characters.';
    if (this.action().trim().length > 1000) errors['action'] = 'Keep it under 1,000 characters.';
    return errors;
  }

  protected save(v: ReflectionEditor): void {
    if (this.saving()) return;
    const errors = this.check();
    this.errors.set(errors);
    this.failed.set(false);
    if (Object.keys(errors).length) return;
    this.saving.set(true);
    this.api
      .saveReflection(v.lessonId, {
        mood: this.mood(),
        text: this.text().trim(),
        action: this.action().trim() || null,
        shared: this.shared(),
      })
      .subscribe((outcome) => this.done(v, outcome));
  }

  private done(v: ReflectionEditor, outcome: ReflectionSaveResult): void {
    this.saving.set(false);
    if (outcome.status === 'loaded') {
      this.saved.set(outcome.value);
      this.toasts.show({
        tone: 'success',
        title: 'Reflection saved',
        text: outcome.value.shared ? `Shared with ${this.mentor(v)}.` : 'Only you can see it.',
      });
    } else if (outcome.status === 'invalid') {
      this.errors.set(outcome.errors);
    } else {
      this.failed.set(true);
    }
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
