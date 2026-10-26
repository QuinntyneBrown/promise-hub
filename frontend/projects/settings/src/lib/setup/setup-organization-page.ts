import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SETUP_API } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhCard,
  PhErrorSummary,
  PhPageHeader,
  PhTextField,
} from '@promisehub/components';

/** Set up › Organization (mock: onboard-org): the name families see and the city; "Finish later" keeps progress. */
@Component({
  selector: 'ph-setup-organization-page',
  imports: [FormsModule, PhAlert, PhButton, PhCard, PhErrorSummary, PhPageHeader, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './setup-organization-page.html',
  styleUrl: './setup.css',
})
export class SetupOrganizationPage {
  private readonly api = inject(SETUP_API);
  private readonly router = inject(Router);

  protected readonly name = signal('');
  protected readonly city = signal('');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    ['name', 'city']
      .filter((f) => this.errors()[f])
      .map((field) => ({ field, message: this.errors()[field]! })),
  );

  constructor() {
    this.api.profile().subscribe((r) => {
      if (r.status === 'loaded') {
        this.name.set(r.value.name);
        this.city.set(r.value.city);
      }
    });
  }

  protected save(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.saveProfile({ name: this.name(), city: this.city() }).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') void this.router.navigateByUrl('/setup');
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
