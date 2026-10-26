import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PRIVACY_API } from '@promisehub/api';
import {
  Fact,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhPageHeader,
  PhRadioGroup,
  PhSkeleton,
  PhTabs,
  RadioOption,
  ToastService,
} from '@promisehub/components';
import { SETTINGS_SECTIONS } from '../settings-sections';

/** Settings › Privacy and data (mock: settings-privacy): the region, consent retention and guardian requests. */
@Component({
  selector: 'ph-settings-privacy-page',
  imports: [
    FormsModule,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
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

  protected readonly sections = SETTINGS_SECTIONS;
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly facts = signal<Fact[]>([]);
  protected readonly retention = signal('7');
  protected readonly saving = signal(false);
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
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
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
