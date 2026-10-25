import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GUARDIAN_API, GuardianHome, GuardianPageResult } from '@promisehub/api';
import {
  PhAlert,
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhGuardianShell,
  PhList,
  PhListItem,
  PhTextField,
} from '@promisehub/components';
import { guardianText, longDate, timeRange } from '../guardian-text';
import { homeText } from '../home-text';

type Enrollment = GuardianHome['children'][number]['enrollments'][number];
type Step = 'contact' | 'code' | 'locked';

/**
 * The guardian home (mock: guardian-home, states status, declined, none), opened from an enrollment decision text: verify
 * the device with a code, then each child's programs with the status, the waitlist position and the note (L2-013 criterion 12).
 */
@Component({
  selector: 'ph-guardian-home-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhGuardianShell,
    PhList,
    PhListItem,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-home-page.html',
})
export class GuardianHomePage {
  private readonly api = inject(GUARDIAN_API);
  private readonly document = inject(DOCUMENT);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<GuardianHome> | null>(null);
  protected readonly step = signal<Step>('contact');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly answered = signal<'OnTheWay' | 'Absent' | null>(null);
  protected contact = '';
  protected code = '';

  protected readonly language = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.language : r?.status === 'verify' ? r.language : 'en';
  });
  protected readonly t = computed(() => guardianText(this.language()));
  protected readonly h = computed(() => homeText(this.language()));
  protected readonly organization = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value.organization;
    return r?.status === 'verify' || r?.status === 'gone' ? r.organization : null;
  });
  protected readonly phone = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value.phone;
    return r?.status === 'verify' || r?.status === 'gone' ? r.phone : null;
  });

  constructor() {
    const html = this.document.documentElement;
    inject(DestroyRef).onDestroy(() => html.setAttribute('lang', 'en'));
    effect(() => html.setAttribute('lang', this.language()));
    effect(() => this.load(this.token()));
  }

  protected load(token: string): void {
    this.api.home(token).subscribe((r) => this.result.set(r));
  }

  protected rows(home: GuardianHome): {
    key: string;
    title: string;
    meta: string;
    badge: string;
    tone: 'success' | 'warning' | 'danger' | 'neutral';
  }[] {
    return home.children.flatMap((c) =>
      c.enrollments.map((e) => ({
        key: `${c.name}-${e.program}`,
        title: `${c.name} · ${e.program}`,
        ...this.describe(e),
      })),
    );
  }

  private describe(e: Enrollment): {
    meta: string;
    badge: string;
    tone: 'success' | 'warning' | 'danger' | 'neutral';
  } {
    const h = this.h();
    switch (e.status) {
      case 'Enrolled':
        return {
          meta: [h.enrolledMeta(longDate(e.startsOn, this.language())), e.note]
            .filter(Boolean)
            .join(' '),
          badge: h.enrolled,
          tone: 'success',
        };
      case 'Waitlisted':
        return {
          meta: h.waitlistedMeta(e.position ?? 0),
          badge: h.waitlisted(e.position ?? 0),
          tone: 'warning',
        };
      case 'Declined':
        return { meta: h.declinedMeta(e.note ?? ''), badge: h.declined, tone: 'danger' };
      default:
        return { meta: h.waitingMeta, badge: h.waiting, tone: 'neutral' };
    }
  }

  protected startTime(startsAt: string): string {
    return timeRange(startsAt, startsAt, this.language()).split('–')[0]!.trim();
  }

  /** Answers a no-show text from the page instead of replying 1 or 2 (L2-018 criterion 8). */
  protected answerNoShow(eventId: string, reply: 'OnTheWay' | 'Absent'): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.answerNoShow(this.token(), eventId, reply).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.answered.set(reply);
        this.load(this.token());
      } else this.failed.set(true);
    });
  }

  protected requestCode(): void {
    this.busy.set(true);
    this.api.requestCode(this.token(), this.contact).subscribe((r) => {
      this.busy.set(false);
      if (r === 'gone') this.load(this.token());
      else if (r === 'sent') this.step.set('code');
      else this.failed.set(true);
    });
  }

  protected verify(): void {
    this.busy.set(true);
    this.errors.set({});
    this.api.verify(this.token(), this.code).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'verified' || r.status === 'gone') this.load(this.token());
      else if (r.status === 'invalid') this.errors.set({ code: r.message });
      else if (r.status === 'locked') this.step.set('locked');
      else this.failed.set(true);
    });
  }
}
