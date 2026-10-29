import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  ORGANIZATION_SETTINGS_API,
  OrganizationDetails,
  OrganizationLogo,
  SESSION_API,
} from '@promisehub/api';
import {
  Fact,
  PhAlert,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhFileUpload,
  PhInlineMessage,
  PhOrgLogo,
  PhPageHeader,
  PhSkeleton,
  PhTabs,
  ToastService,
  formatDay,
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
    PhAlert,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhFileUpload,
    PhInlineMessage,
    PhOrgLogo,
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
  protected readonly uploading = signal(false);
  protected readonly removing = signal(false);
  protected readonly logoError = signal<string | null>(null);
  protected readonly logoFailed = signal(false);
  /** The logo image's address, versioned by when it was uploaded so a new logo is fetched again. */
  protected readonly logoSrc = computed(() => {
    const logo = this.profile()?.logo;
    return logo ? this.api.logoUrl(logo.uploadedAt) : null;
  });

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

  protected logoMeta(logo: OrganizationLogo): string {
    return `Uploaded ${formatDay(logo.uploadedAt)} by ${logo.uploadedBy}`;
  }

  /** Uploads a PNG or JPEG as the logo (L2-123); a refused file says why under the drop zone. */
  protected uploadLogo(file: File): void {
    this.uploading.set(true);
    this.logoError.set(null);
    this.logoFailed.set(false);
    this.api.uploadLogo(file).subscribe((outcome) => {
      this.uploading.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({ tone: 'success', title: 'Logo saved' });
        this.reloadProfile();
      } else if (outcome.status === 'invalid') {
        this.logoError.set(`“${file.name}” wasn’t uploaded. Choose a PNG or JPEG of up to 1 MB.`);
      } else {
        this.logoFailed.set(true);
      }
    });
  }

  protected removeLogo(): void {
    this.removing.set(true);
    this.api.removeLogo().subscribe((outcome) => {
      this.removing.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({ tone: 'success', title: 'Logo removed' });
        this.reloadProfile();
      } else {
        this.toasts.show({
          tone: 'danger',
          title: 'Logo not removed',
          text: 'Something went wrong. Try again.',
        });
      }
    });
  }

  private reloadProfile(): void {
    this.api.profile().subscribe((r) => r.status === 'loaded' && this.profile.set(r.value));
  }

  /** Edits the profile in a dialog (dialog: organization-profile); the session refreshes so the shell shows a new name. */
  protected editProfile(p: OrganizationDetails): void {
    this.dialogs
      .open<boolean, OrganizationDetails, OrganizationProfileDialog>(OrganizationProfileDialog, p)
      .closed.subscribe((saved) => {
        if (!saved) return;
        this.toasts.show({ tone: 'success', title: 'Organization profile saved' });
        this.sessions.refresh();
        this.reloadProfile();
      });
  }
}
