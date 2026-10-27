import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  GatedResult,
  LEARNING_API,
  REFLECTION_DRAFT_STORE,
  SESSION_API,
  Reflection,
  ReflectionEditor,
  ReflectionSaveResult,
} from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhDialogs,
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
import { Observable, Subject, combineLatest, map, startWith, switchMap, tap } from 'rxjs';
import { CanLeave } from '../can-leave';
import { LeaveReflectionDialog } from '../leave-reflection-dialog/leave-reflection-dialog';
import { LeaveChoice } from '../unsaved-changes-dialog/leave-choice';

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
 * whether her mentor may read it, checked here as the server checks them, then saved. Private unless she turns sharing on. Unsaved
 * words are protected (L2-079 criterion 5): Save draft keeps them on this device, a draft is restored on return, a save clears it, and
 * leaving with unsaved changes asks first through leave-reflection.
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
export class ReflectionPage implements CanLeave {
  private readonly api = inject(LEARNING_API);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(PhDialogs);
  private readonly drafts = inject(REFLECTION_DRAFT_STORE);
  private readonly session = inject(SESSION_API);
  private membershipId = '';
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
  /** When the restored draft was saved, while it shows. */
  protected readonly restored = signal<string | null>(null);
  /** What the form held when it loaded or was last saved, here or as a draft. */
  private readonly baseline = signal('');
  protected readonly dirty = computed(() => this.snapshot() !== this.baseline());
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
            combineLatest([this.api.reflection(id), this.session.current()]).pipe(
              tap(([r, me]) => {
                this.membershipId = me.membershipId;
                if (r.status === 'loaded') this.fill(r.value);
              }),
              map(([r]) => r),
              startWith<GatedResult<ReflectionEditor> | null>(null),
            ),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  private snapshot(): string {
    return JSON.stringify([this.mood(), this.text(), this.action(), this.shared()]);
  }

  private fill(v: ReflectionEditor): void {
    const r = v.reflection;
    this.mood.set(r?.mood ?? '');
    this.text.set(r?.text ?? '');
    this.action.set(r?.action ?? '');
    this.shared.set(r?.shared ?? false);
    this.baseline.set(this.snapshot());
    const draft = this.drafts.load(this.membershipId, v.lessonId);
    if (draft) {
      this.mood.set(draft.mood);
      this.text.set(draft.text);
      this.action.set(draft.action);
      this.shared.set(draft.shared);
      this.baseline.set(this.snapshot());
    }
    this.restored.set(draft ? formatDateTime(draft.savedAt) : null);
  }

  protected saveDraft(v: ReflectionEditor): void {
    this.keepDraft(v.lessonId);
    this.toasts.show({
      tone: 'success',
      title: 'Draft saved',
      text: 'On this device. Nobody else can see a draft.',
    });
  }

  private keepDraft(lessonId: string): void {
    this.drafts.save(this.membershipId, lessonId, {
      mood: this.mood(),
      text: this.text(),
      action: this.action(),
      shared: this.shared(),
      savedAt: new Date().toISOString(),
    });
    this.baseline.set(this.snapshot());
  }

  /** Clears the draft and goes back to what was last saved on the server. */
  protected startOver(v: ReflectionEditor): void {
    this.drafts.clear(this.membershipId, v.lessonId);
    const r = this.saved() ?? v.reflection;
    this.mood.set(r?.mood ?? '');
    this.text.set(r?.text ?? '');
    this.action.set(r?.action ?? '');
    this.shared.set(r?.shared ?? false);
    this.baseline.set(this.snapshot());
    this.restored.set(null);
  }

  /** Asks before the router leaves unsaved changes (L2-079 criterion 5). */
  canLeave(): Observable<boolean> | boolean {
    const r = this.result();
    if (!this.dirty() || r?.status !== 'loaded') return true;
    const lessonId = r.value.lessonId;
    return this.dialogs
      .open<LeaveChoice, null, LeaveReflectionDialog>(LeaveReflectionDialog, null)
      .closed.pipe(
        map((choice) => {
          if (choice === 'save') this.keepDraft(lessonId);
          return choice === 'save' || choice === 'discard';
        }),
      );
  }

  /** Closing or reloading the tab with unsaved changes: the browser asks. */
  @HostListener('window:beforeunload', ['$event'])
  protected warn(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
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
      this.drafts.clear(this.membershipId, v.lessonId);
      this.restored.set(null);
      this.baseline.set(this.snapshot());
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
