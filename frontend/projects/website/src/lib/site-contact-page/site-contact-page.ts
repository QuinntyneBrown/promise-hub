import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CONTACT_TOPICS, WEBSITE_API } from '@promisehub/api';
import {
  ErrorSummaryItem,
  Fact,
  PhAlert,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhSelect,
  PhTextField,
  PhTextarea,
} from '@promisehub/components';
import { SiteState } from '../site-state';

/** The server's field names and the ids of the fields on the page, for the error summary's links. */
const FIELD: Record<string, string> = {
  name: 'contact-name',
  email: 'contact-email',
  topic: 'contact-topic',
  message: 'contact-message',
};

/**
 * Contact (mock: site-contact, L2-134 criterion 1): the screen is the form. A sent message is replaced by the acknowledgement; errors show
 * inline with a summary; a failed send keeps what was typed.
 */
@Component({
  selector: 'ph-site-contact-page',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhSelect,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-contact-page.html',
  styleUrl: './site-contact-page.css',
})
export class SiteContactPage {
  private readonly api = inject(WEBSITE_API);
  protected readonly state = inject(SiteState);
  protected readonly topics = [...CONTACT_TOPICS];

  protected name = '';
  protected email = '';
  protected topic: string = CONTACT_TOPICS[0];
  protected readonly message = signal('');
  protected readonly count = computed(
    () => `${this.message().length.toLocaleString('en-US')} / 2,000`,
  );
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly problem = signal<'failed' | 'too-many' | null>(null);
  protected readonly busy = signal(false);
  /** The first name of who sent the message, once sent. */
  protected readonly sentBy = signal<string | null>(null);
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: FIELD[key] ?? key, message })),
  );

  protected readonly findUs = computed<Fact[]>(() => {
    const s = this.state.site();
    if (s?.status !== 'loaded') return [];
    const facts: Fact[] = [{ key: 'where', term: 'Where', value: s.value.city }];
    if (s.value.email) facts.push({ key: 'email', term: 'Email', value: s.value.email });
    return facts;
  });

  constructor() {
    this.state.useTitle('Contact');
  }

  protected send(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.problem.set(null);
    this.errors.set({});
    this.api
      .contact(this.state.slug(), {
        name: this.name,
        email: this.email,
        topic: this.topic,
        message: this.message(),
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'sent')
          this.sentBy.set(this.name.trim().split(/\s+/)[0] ?? this.name);
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else if (outcome.status === 'too-many') this.problem.set('too-many');
        else this.problem.set('failed');
      });
  }
}
