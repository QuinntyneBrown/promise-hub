import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BadgeDetail,
  BadgeKind,
  BadgeOptions,
  BadgeRule,
  CURRICULUM_API,
  LoadResult,
} from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAchievementBadge,
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhErrorSummary,
  PhList,
  PhListItem,
  PhPageHeader,
  PhRadioGroup,
  PhSelect,
  PhSkeleton,
  PhTextField,
  PhTextarea,
  RadioOption,
  SelectOption,
  ToastService,
  formatDay,
} from '@promisehub/components';
import { Observable, combineLatest, map, of, startWith, Subject, switchMap } from 'rxjs';
import { BADGE_ICONS, RULE_LABELS, badgeIcon } from '../badge-labels';
import { DeleteBadgeDialog } from '../delete-badge-dialog/delete-badge-dialog';
import { DeleteBadgeDialogData } from '../delete-badge-dialog/delete-badge-dialog-data';

/** What the builder loads: the options and, for an existing badge, the badge. */
interface Loaded {
  options: BadgeOptions;
  badge: BadgeDetail | null;
}

const SUMMARY_FIELDS: Record<string, string> = { targetId: 'target', competencyId: 'competency' };
const NOUN: Record<BadgeRule, string> = {
  LessonCompleted: 'lesson',
  ModuleCompleted: 'module',
  QuizPassed: 'quiz',
  AssignmentAccepted: 'assignment',
};

/**
 * The badge builder (mock: curriculum-badge new, edit and automatic, L2-084): the badge, how it is earned, a preview and who earned it.
 * A new badge opens at /curriculum/badges/new and, once saved, at its own address.
 */
@Component({
  selector: 'ph-badge-builder-page',
  imports: [
    FormsModule,
    PhAchievementBadge,
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorSummary,
    PhList,
    PhListItem,
    PhPageHeader,
    PhRadioGroup,
    PhSelect,
    PhSkeleton,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge-builder-page.html',
})
export class BadgeBuilderPage {
  private readonly api = inject(CURRICULUM_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter; absent for a new badge. */
  readonly badgeId = input<string | undefined>(undefined);

  protected readonly result = toSignal<LoadResult<Loaded> | null>(
    toObservable(this.badgeId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() => this.load(id).pipe(startWith<LoadResult<Loaded> | null>(null))),
        ),
      ),
    ),
    { initialValue: null },
  );
  protected form = {
    name: '',
    description: '',
    icon: 'star',
    kind: 'Automatic' as BadgeKind,
    rule: 'LessonCompleted' as BadgeRule,
    targetId: '',
    competencyId: '',
  };
  /** Bumped when a field the preview shows changes, so the preview follows the form. */
  protected readonly edits = signal(0);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([field, message]) => ({
      field: SUMMARY_FIELDS[field] ?? field,
      message,
    })),
  );
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly icons = BADGE_ICONS;
  protected readonly kinds: RadioOption[] = [
    {
      value: 'Automatic',
      label: 'Automatically, by a rule',
      hint: 'The server awards it once when a youth meets the rule.',
    },
    { value: 'Manual', label: 'By hand', hint: 'A program director awards it to a youth.' },
  ];
  protected readonly rules: SelectOption[] = (Object.keys(RULE_LABELS) as BadgeRule[]).map(
    (value) => ({ value, label: RULE_LABELS[value] }),
  );
  protected readonly badgeIcon = badgeIcon;
  protected readonly formatDay = formatDay;

  constructor() {
    effect(() => {
      const r = this.result();
      if (r?.status !== 'loaded') return;
      const b = r.value.badge;
      this.form = b
        ? {
            name: b.name,
            description: b.description ?? '',
            icon: b.icon,
            kind: b.kind,
            rule: b.rule ?? 'LessonCompleted',
            targetId: b.targetId ?? '',
            competencyId: b.competencyId ?? '',
          }
        : {
            name: '',
            description: '',
            icon: 'star',
            kind: 'Automatic',
            rule: 'LessonCompleted',
            targetId: '',
            competencyId: '',
          };
      this.edits.update((n) => n + 1);
    });
  }

  private load(id: string | undefined): Observable<LoadResult<Loaded>> {
    const badge: Observable<LoadResult<BadgeDetail | null>> = id
      ? this.api.badge(id)
      : of({ status: 'loaded', value: null });
    return combineLatest([this.api.badgeOptions(), badge]).pipe(
      map(([options, b]): LoadResult<Loaded> => {
        if (b.status !== 'loaded') return b;
        if (options.status !== 'loaded') return options;
        return { status: 'loaded', value: { options: options.value, badge: b.value } };
      }),
    );
  }

  protected changed(): void {
    this.edits.update((n) => n + 1);
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected targets(o: BadgeOptions): SelectOption[] {
    const list = {
      LessonCompleted: o.lessons,
      ModuleCompleted: o.modules,
      QuizPassed: o.quizzes,
      AssignmentAccepted: o.assignments,
    }[this.form.rule];
    return [
      { value: '', label: `Choose a ${NOUN[this.form.rule]}` },
      ...list.map((t) => ({ value: t.id, label: t.title })),
    ];
  }

  protected competencies(o: BadgeOptions): SelectOption[] {
    return [
      { value: '', label: 'None' },
      ...o.competencies.map((c) => ({ value: c.id, label: c.name })),
    ];
  }

  /** The preview's name and caption, from the form as it stands. */
  protected preview(): { name: string; caption: string } {
    this.edits();
    return {
      name: this.form.name.trim() || 'New badge',
      caption: this.form.description.trim() || 'How youth earn it shows here.',
    };
  }

  protected save(badge: BadgeDetail | null): void {
    this.busy.set(true);
    this.failed.set(false);
    const automatic = this.form.kind === 'Automatic';
    const fields = {
      name: this.form.name,
      description: this.form.description,
      icon: this.form.icon,
      kind: this.form.kind,
      rule: automatic ? this.form.rule : null,
      targetId: automatic ? this.form.targetId || null : null,
      competencyId: this.form.competencyId || null,
    };
    const call = badge ? this.api.updateBadge(badge.id, fields) : this.api.createBadge(fields);
    call.subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.errors.set({});
        this.toasts.show({ tone: 'success', title: 'Badge saved', text: this.form.name.trim() });
        if (badge) {
          this.reload();
        } else {
          void this.router.navigate(['/curriculum/badges', outcome.id]);
        }
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }

  protected remove(badge: BadgeDetail): void {
    this.dialogs
      .open<boolean, DeleteBadgeDialogData, DeleteBadgeDialog>(DeleteBadgeDialog, {
        id: badge.id,
        name: badge.name,
      })
      .closed.subscribe((deleted) => {
        if (!deleted) return;
        this.toasts.show({
          tone: 'success',
          title: 'Badge deleted',
          text: `Youth who earned ${badge.name} keep it.`,
        });
        void this.router.navigate(['/curriculum/badges']);
      });
  }
}
