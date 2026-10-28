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
import { RouterLink } from '@angular/router';
import { GUARDIAN_API, GuardianChild, GuardianPageResult } from '@promisehub/api';
import {
  PhAlert,
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhGuardianShell,
  PhList,
  PhListItem,
  PhSkeleton,
  PhTextField,
} from '@promisehub/components';
import { guardianText, timeRange } from '../guardian-text';
import { portalText, shortDate } from '../portal-text';

type Step = 'contact' | 'code' | 'locked';
type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
interface Row {
  key: string;
  title: string;
  meta: string;
  badge: string | null;
  tone: Tone;
}

/**
 * A child's page on the guardian portal (mock: guardian-child, L2-102, L2-104): the schedule of the next four weeks and the consents on
 * record, read only, in the household's language. The household comes from the link; another family's child is not available.
 */
@Component({
  selector: 'ph-guardian-child-page',
  imports: [
    FormsModule,
    RouterLink,
    PhAlert,
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhGuardianShell,
    PhList,
    PhListItem,
    PhSkeleton,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-child-page.html',
})
export class GuardianChildPage {
  private readonly api = inject(GUARDIAN_API);
  private readonly document = inject(DOCUMENT);

  readonly token = input.required<string>();
  readonly childId = input.required<string>();

  protected readonly result = signal<GuardianPageResult<GuardianChild> | null>(null);
  protected readonly step = signal<Step>('contact');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected contact = '';
  protected code = '';

  protected readonly language = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.language : r?.status === 'verify' ? r.language : 'en';
  });
  protected readonly t = computed(() => guardianText(this.language()));
  protected readonly p = computed(() => portalText(this.language()));
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
    effect(() => this.load(this.token(), this.childId()));
  }

  protected load(token: string, childId: string): void {
    this.result.set(null);
    this.api.child(token, childId).subscribe((r) => this.result.set(r));
  }

  protected sessions(child: GuardianChild): Row[] {
    const p = this.p();
    const lang = this.language();
    return child.schedule.map((s) => ({
      key: s.eventId,
      title: s.name,
      meta: [shortDate(s.startsAt, lang), timeRange(s.startsAt, s.endsAt, lang), s.place]
        .filter(Boolean)
        .join(' · '),
      badge: s.status === 'Cancelled' ? p.cancelled : s.today ? p.today : null,
      tone: s.status === 'Cancelled' ? 'danger' : 'info',
    }));
  }

  protected consents(child: GuardianChild): Row[] {
    const p = this.p();
    const lang = this.language();
    const rows: Row[] = [];
    const c = child.consents.participation;
    if (c) {
      rows.push({
        key: 'participation',
        title: p.participation,
        meta:
          c.status === 'Given'
            ? p.signedBy(
                c.signedBy ?? '',
                c.relationship,
                shortDate(c.signedAt ?? '', lang),
                c.reference,
              )
            : c.status === 'Withdrawn'
              ? p.withdrawnBy(c.withdrawnBy ?? '', shortDate(c.withdrawnAt ?? '', lang))
              : p.neededText,
        badge: c.status === 'Given' ? p.given : c.status === 'Withdrawn' ? p.withdrawn : p.needed,
        tone: c.status === 'Given' ? 'success' : c.status === 'Withdrawn' ? 'danger' : 'warning',
      });
    }
    for (const s of child.consents.slips ?? []) {
      rows.push({
        key: s.eventId,
        title: s.event,
        meta:
          s.status === 'Signed'
            ? p.slipSigned(s.signedBy ?? '', shortDate(s.at ?? '', lang))
            : s.status === 'Declined'
              ? p.slipDeclined(s.signedBy ?? '', shortDate(s.at ?? '', lang))
              : p.signBy(shortDate(s.signBy, lang)),
        badge:
          s.status === 'Signed' ? p.signed : s.status === 'Declined' ? p.declined : p.notSigned,
        tone: s.status === 'Signed' ? 'success' : s.status === 'Declined' ? 'danger' : 'warning',
      });
    }
    return rows;
  }

  protected requestCode(): void {
    this.busy.set(true);
    this.api.requestCode(this.token(), this.contact).subscribe((r) => {
      this.busy.set(false);
      if (r === 'gone') this.load(this.token(), this.childId());
      else if (r === 'sent') this.step.set('code');
      else this.failed.set(true);
    });
  }

  protected verify(): void {
    this.busy.set(true);
    this.errors.set({});
    this.api.verify(this.token(), this.code).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'verified' || r.status === 'gone') this.load(this.token(), this.childId());
      else if (r.status === 'invalid') this.errors.set({ code: r.message });
      else if (r.status === 'locked') this.step.set('locked');
      else this.failed.set(true);
    });
  }
}
