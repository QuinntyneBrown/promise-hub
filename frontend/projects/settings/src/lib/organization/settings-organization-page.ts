import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ORGANIZATION_SETTINGS_API, OrganizationDetails, SESSION_API } from '@promisehub/api';
import {
  Fact,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhInlineMessage,
  PhPageHeader,
  PhSkeleton,
  PhTabs,
  ToastService,
} from '@promisehub/components';
import { OrganizationProfileDialog } from '../organization-profile-dialog/organization-profile-dialog';
import { SETTINGS_SECTIONS } from '../settings-sections';
import { timeZoneLabel } from '../time-zones';

/**
 * Settings › Organization (mock: settings-organization, L2-122, ADR 0073): the organization's profile, read here and edited in a dialog.
 */
@Component({
  selector: 'ph-settings-organization-page',
  imports: [
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhInlineMessage,
    PhPageHeader,
    PhSkeleton,
    PhTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-organization-page.html',
  styleUrl: './settings-organization-page.css',
})
export class SettingsOrganizationPage {
  private readonly api = inject(ORGANIZATION_SETTINGS_API);
  private readonly sessions = inject(SESSION_API);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(PhDialogs);

  protected readonly sections = SETTINGS_SECTIONS;
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly profile = signal<OrganizationDetails | null>(null);
  protected readonly subtitle = computed(() => this.profile()?.name ?? '');

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.profile().subscribe((r) => {
      if (r.status === 'loaded') {
        this.profile.set(r.value);
        this.state.set('loaded');
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  protected profileFacts(p: OrganizationDetails): Fact[] {
    return [
      { key: 'name', term: 'Name', value: p.name },
      { key: 'city', term: 'City', value: p.city },
      { key: 'contact-email', term: 'Contact email', value: p.contactEmail ?? 'Not given' },
      { key: 'phone', term: 'Phone', value: p.phone ?? 'Not given' },
      { key: 'time-zone', term: 'Time zone', value: timeZoneLabel(p.timeZone) },
    ];
  }

  /** Edits the profile in a dialog (dialog: organization-profile); the session refreshes so the shell shows a new name. */
  protected editProfile(p: OrganizationDetails): void {
    this.dialogs
      .open<boolean, OrganizationDetails, OrganizationProfileDialog>(OrganizationProfileDialog, p)
      .closed.subscribe((saved) => {
        if (!saved) return;
        this.toasts.show({ tone: 'success', title: 'Organization profile saved' });
        this.sessions.refresh();
        this.api.profile().subscribe((r) => r.status === 'loaded' && this.profile.set(r.value));
      });
  }
}
