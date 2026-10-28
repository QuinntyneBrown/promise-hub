import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DISPLAY_API, DisplayPreferences, SESSION_API } from '@promisehub/api';
import {
  BreadcrumbItem,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDisplayRoot,
  PhEmptyState,
  PhPageHeader,
  PhRadioGroup,
  PhSkeleton,
  PhSwitch,
  RadioOption,
  ToastService,
} from '@promisehub/components';

/**
 * Your account › Display (mock: settings-display, L2-119, L2-120): theme, text size and reduce motion. Every choice previews at once
 * through the document root; Save changes keeps it with the account; Cancel or leaving puts the saved choice back.
 */
@Component({
  selector: 'ph-display-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhRadioGroup,
    PhSkeleton,
    PhSwitch,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './display-page.html',
  styleUrl: './display-page.css',
})
export class DisplayPage implements OnDestroy {
  private readonly api = inject(DISPLAY_API);
  private readonly sessions = inject(SESSION_API);
  private readonly root = inject(PhDisplayRoot);
  private readonly toasts = inject(ToastService);

  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Your account', link: '/account' },
    { label: 'Display' },
  ];
  protected readonly themes: RadioOption[] = [
    { value: 'system', label: 'System', hint: 'Follows your device’s light or dark setting.' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
  protected readonly sizes: RadioOption[] = [
    { value: 'default', label: 'Default' },
    { value: 'large', label: 'Large', hint: 'About an eighth bigger.' },
    { value: 'larger', label: 'Larger', hint: 'About a quarter bigger.' },
  ];
  protected readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly choice = signal<DisplayPreferences | null>(null);
  protected readonly saving = signal(false);
  protected readonly failed = signal(false);
  private saved: DisplayPreferences | null = null;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.load().subscribe((r) => {
      if (r.status === 'loaded') {
        this.saved = r.value;
        this.choice.set(r.value);
        this.state.set('loaded');
      } else {
        this.state.set('error');
      }
    });
  }

  protected pick(change: Partial<DisplayPreferences>): void {
    const current = this.choice();
    if (!current) return;
    const next = { ...current, ...change };
    this.choice.set(next);
    this.root.apply(next);
  }

  protected save(): void {
    const choice = this.choice();
    if (!choice) return;
    this.saving.set(true);
    this.failed.set(false);
    this.api.save(choice).subscribe((outcome) => {
      this.saving.set(false);
      if (outcome.status === 'saved') {
        this.saved = choice;
        this.toasts.show({
          tone: 'success',
          title: 'Display saved',
          text: 'It follows you to every device you sign in on.',
        });
        this.sessions.refresh();
      } else {
        this.failed.set(true);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.saved) this.root.apply(this.saved);
  }
}
