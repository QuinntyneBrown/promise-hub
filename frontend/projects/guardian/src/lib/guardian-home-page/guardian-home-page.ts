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
  PhDialogs,
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
import {
  GuardianDetailsData,
  GuardianDetailsDialog,
} from '../guardian-details-dialog/guardian-details-dialog';
import { dataRequestText } from '../data-request-text';
import {
  GuardianDataRequestData,
  GuardianDataRequestDialog,
} from '../guardian-data-request-dialog/guardian-data-request-dialog';
import {
  GuardianPickupData,
  GuardianPickupDialog,
} from '../guardian-pickup-dialog/guardian-pickup-dialog';
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
  private readonly dialogs = inject(PhDialogs);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<GuardianHome> | null>(null);
  protected readonly step = signal<Step>('contact');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly answered = signal<'OnTheWay' | 'Absent' | null>(null);
  protected readonly pickupAnswered = signal(false);
  protected readonly detailsSaved = signal(false);
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

  /** Adds or removes an adult who may collect the child (L2-020 criterion 5). */
  protected editPickups(
    child: GuardianHome['children'][number],
    remove: { id: string; name: string } | null,
  ): void {
    this.dialogs
      .open<boolean, GuardianPickupData, GuardianPickupDialog>(GuardianPickupDialog, {
        token: this.token(),
        childId: child.id,
        child: child.firstName,
        text: this.h(),
        remove,
      })
      .closed.subscribe((done) => done && this.load(this.token()));
  }

  /** Approves or refuses someone not on the list who is waiting to collect a child (L2-020 criterion 7). */
  protected decidePickup(requestId: string, approve: boolean): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.decidePickup(this.token(), requestId, approve).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.pickupAnswered.set(true);
        this.load(this.token());
      } else this.failed.set(true);
    });
  }

  protected readonly dataText = computed(() => dataRequestText(this.language()));
  protected readonly dataRequested = signal(false);

  /** Asks for a copy or deletion of the household's data (L2-030 criterion 4). */
  protected requestData(home: GuardianHome): void {
    this.dialogs
      .open<boolean, GuardianDataRequestData, GuardianDataRequestDialog>(
        GuardianDataRequestDialog,
        {
          token: this.token(),
          text: this.dataText(),
          email: home.contact?.email ?? null,
        },
      )
      .closed.subscribe((done) => done && this.dataRequested.set(true));
  }

  /** Opens the correction dialog for the guardian's contact (no child) or a child's medical details (L2-011 criterion 7). */
  protected editDetails(home: GuardianHome, child: GuardianHome['children'][number] | null): void {
    this.dialogs
      .open<boolean, GuardianDetailsData, GuardianDetailsDialog>(GuardianDetailsDialog, {
        token: this.token(),
        text: this.h(),
        contact: child ? null : (home.contact ?? null),
        child: child
          ? {
              id: child.id,
              firstName: child.firstName,
              allergies: child.allergies ?? null,
              medication: child.medication ?? null,
            }
          : null,
      })
      .closed.subscribe((done) => {
        if (!done) return;
        this.detailsSaved.set(true);
        this.load(this.token());
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
