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
import { GUARDIAN_API, GuardianAnnouncements, GuardianPageResult } from '@promisehub/api';
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
import { guardianText } from '../guardian-text';
import { portalText, shortDate } from '../portal-text';

type Step = 'contact' | 'code' | 'locked';

/**
 * The household's announcements (mock: guardian-announcements, L2-103): the messages staff sent the family from Messages, newest first,
 * New on the unread ones, and Mark all read; in the household's language, the announcements as staff wrote them.
 */
@Component({
  selector: 'ph-guardian-announcements-page',
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
  templateUrl: './guardian-announcements-page.html',
})
export class GuardianAnnouncementsPage {
  private readonly api = inject(GUARDIAN_API);
  private readonly document = inject(DOCUMENT);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<GuardianAnnouncements> | null>(null);
  protected readonly step = signal<Step>('contact');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly marking = signal(false);
  protected readonly markFailed = signal(false);
  protected readonly allRead = signal(false);
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
    effect(() => this.load(this.token()));
  }

  protected load(token: string): void {
    this.api.announcements(token).subscribe((r) => this.result.set(r));
  }

  protected from(who: string, at: string): string {
    return this.p().from(who, shortDate(at, this.language()));
  }

  /** Marks every announcement read; on failure nothing changes and the New badges stay (L2-103 criterion 3). */
  protected markAllRead(): void {
    this.marking.set(true);
    this.markFailed.set(false);
    this.api.markAnnouncementsRead(this.token()).subscribe((outcome) => {
      this.marking.set(false);
      if (outcome.status === 'saved') {
        this.allRead.set(true);
        this.load(this.token());
      } else this.markFailed.set(true);
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
