import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ConsentPolicy,
  DataRequest,
  PRIVACY_API,
  SESSION_API,
  settingsSections,
} from '@promisehub/api';
import {
  Fact,
  PhButton,
  PhCard,
  PhBadge,
  PhDialogs,
  PhDescriptionList,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhRadioGroup,
  PhSkeleton,
  PhTabs,
  RadioOption,
  ToastService,
  PhInlineMessage,
} from '@promisehub/components';
import { ConsentPolicyDialog } from '../consent-policy-dialog/consent-policy-dialog';
import { ConsentPolicyDialogData } from '../consent-policy-dialog-data';

/** Settings › Privacy and data (mock: settings-privacy): the region, consent retention and guardian requests. */
@Component({
  selector: 'ph-settings-privacy-page',
  imports: [
    PhInlineMessage,
    FormsModule,
    PhBadge,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhRadioGroup,
    PhSkeleton,
    PhTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-privacy-page.html',
  styleUrl: './settings-privacy-page.css',
})
export class SettingsPrivacyPage {
  private readonly api = inject(PRIVACY_API);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(PhDialogs);

  protected readonly sections = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(map((s) => settingsSections(s.modules))),
    { initialValue: settingsSections([]) },
  );
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly facts = signal<Fact[]>([]);
  protected readonly retention = signal('7');
  protected readonly saving = signal(false);
  protected readonly requests = signal<DataRequest[]>([]);
  protected readonly fulfilling = signal<string | null>(null);
  /** The guardian consent policy; null while Roster is off (the API answers 404) or before it loads. */
  protected readonly consent = signal<ConsentPolicy | null>(null);
  protected readonly options: RadioOption[] = [
    { value: '7', label: '7 years after the event' },
    { value: '3', label: '3 years after the event' },
    { value: 'request', label: 'Until deleted by request' },
  ];

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.load().subscribe((r) => {
      if (r.status === 'loaded') {
        this.facts.set([
          { key: 'region', term: 'Data residency', value: r.value.region },
          { key: 'encryption', term: 'Encryption', value: 'At rest and in transit' },
          { key: 'change', term: 'Changing region', value: 'Ask PromiseHub support' },
        ]);
        this.retention.set(
          r.value.consentRetentionYears === null
            ? 'request'
            : String(r.value.consentRetentionYears),
        );
        this.state.set('loaded');
        this.loadRequests();
        this.loadConsent();
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  private loadRequests(): void {
    this.api
      .requests()
      .subscribe((r) => r.status === 'loaded' && this.requests.set(r.value.requests));
  }

  private loadConsent(): void {
    this.api
      .consentPolicy()
      .subscribe((r) => this.consent.set(r.status === 'loaded' ? r.value : null));
  }

  protected consentFacts(policy: ConsentPolicy): Fact[] {
    return [
      { key: 'consent-age', term: 'Consent needed under', value: `${policy.consentAge} years` },
      { key: 'consent-wording', term: 'Wording guardians sign', value: policy.wording },
    ];
  }

  /** Edits the consent age and wording in a dialog (dialog: consent-policy). */
  protected editConsent(policy: ConsentPolicy): void {
    this.dialogs
      .open<boolean, ConsentPolicyDialogData, ConsentPolicyDialog>(ConsentPolicyDialog, {
        policy,
        save: (p) => this.api.saveConsentPolicy(p),
      })
      .closed.subscribe((saved) => {
        if (!saved) return;
        this.toasts.show({
          tone: 'success',
          title: 'Consent policy saved',
          text: 'It applies from each youth’s next request.',
        });
        this.loadConsent();
      });
  }

  protected requestMeta(r: DataRequest): string {
    const what = r.kind === 'Export' ? 'A copy of their data' : 'Delete their data';
    return r.status === 'Open'
      ? `${what} · send to ${r.email}`
      : `${what} · done by ${r.fulfilledBy}`;
  }

  protected exportUrl(id: string): string {
    return this.api.exportUrl(id);
  }

  /** Fulfils a request: an export is emailed; a deletion removes the household, purged after 30 days. */
  protected fulfil(r: DataRequest): void {
    this.fulfilling.set(r.id);
    this.api.fulfil(r.id).subscribe((outcome) => {
      this.fulfilling.set(null);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title:
            r.kind === 'Export' ? `Copy sent to ${r.email}` : `${r.household} household deleted`,
          text: r.kind === 'Export' ? 'It’s logged.' : 'It’s purged after 30 days.',
        });
        this.loadRequests();
      } else
        this.toasts.show({
          tone: 'danger',
          title: 'Not done',
          text: 'Something went wrong. Try again.',
        });
    });
  }

  protected save(): void {
    this.saving.set(true);
    const value = this.retention();
    this.api.saveRetention(value === 'request' ? null : Number(value)).subscribe((outcome) => {
      this.saving.set(false);
      if (outcome.status === 'saved')
        this.toasts.show({ tone: 'success', title: 'Retention saved' });
      else if (outcome.status === 'forbidden') this.state.set('forbidden');
      else
        this.toasts.show({
          tone: 'danger',
          title: 'Retention not saved',
          text: 'Something went wrong. Try again.',
        });
    });
  }
}
