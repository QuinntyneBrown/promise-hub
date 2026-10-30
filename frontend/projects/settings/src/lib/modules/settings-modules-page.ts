import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  MODULE_CATALOG,
  MODULE_PRESETS,
  MODULES_API,
  ModuleId,
  SESSION_API,
  settingsSections,
} from '@promisehub/api';
import {
  PhButton,
  PhCard,
  PhChip,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSwitch,
  PhTabs,
  ToastService,
} from '@promisehub/components';
import { FormsModule } from '@angular/forms';

/** Settings › Modules (mock: settings-modules): switch modules on and off, with presets and the server's dependency errors. */
@Component({
  selector: 'ph-settings-modules-page',
  imports: [
    FormsModule,
    PhButton,
    PhCard,
    PhChip,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSwitch,
    PhTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-modules-page.html',
  styleUrl: './settings-modules-page.scss',
})
export class SettingsModulesPage {
  private readonly api = inject(MODULES_API);
  private readonly toasts = inject(ToastService);

  protected readonly sections = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(map((s) => settingsSections(s.modules))),
    { initialValue: settingsSections([]) },
  );
  /** The refusal that offers Read the agreement beside Learning Bond (L2-135 criterion 4). */
  protected readonly agreementFirst = 'Accept the Learning Bond data-handling agreement first.';
  protected readonly catalog = MODULE_CATALOG;
  protected readonly presets = MODULE_PRESETS;
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly on = signal<ReadonlySet<ModuleId>>(new Set());
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly saving = signal(false);
  protected readonly preset = computed(() => {
    const on = this.on();
    const match = this.presets.find(
      (p) => p.modules && p.modules.length === on.size && p.modules.every((m) => on.has(m)),
    );
    return match?.name ?? 'Custom';
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.load().subscribe((result) => {
      if (result.status === 'loaded') {
        this.on.set(new Set(result.on));
      }
      this.state.set(result.status);
    });
  }

  /** Every module it needs while a module is off; while it is on, only those still off (L2-135 criterion 1). */
  protected needsCaption(module: ModuleId, needs: ModuleId[]): string | null {
    const missing = this.on().has(module) ? needs.filter((n) => !this.on().has(n)) : needs;
    return missing.length ? `Needs ${missing.map((n) => this.name(n)).join(' and ')}` : null;
  }

  protected set(module: ModuleId, on: boolean): void {
    const next = new Set(this.on());
    if (on) {
      next.add(module);
    } else {
      next.delete(module);
    }
    this.on.set(next);
  }

  protected applyPreset(modules: ModuleId[] | null): void {
    if (modules) {
      this.on.set(new Set(modules));
      this.errors.set({});
    }
  }

  protected save(): void {
    this.saving.set(true);
    const on = this.catalog.map((m) => m.id).filter((id) => this.on().has(id));
    this.api.save(on).subscribe((outcome) => {
      this.saving.set(false);
      switch (outcome.status) {
        case 'saved':
          this.errors.set({});
          this.toasts.show({ tone: 'success', title: 'Modules saved', text: `${outcome.on} on` });
          break;
        case 'invalid':
          this.errors.set(Object.fromEntries(outcome.errors.map((e) => [e.module, e.message])));
          break;
        case 'forbidden':
          this.state.set('forbidden');
          break;
        default:
          this.toasts.show({
            tone: 'danger',
            title: 'Modules not saved',
            text: 'Something went wrong. Try again.',
          });
      }
    });
  }

  private name(id: ModuleId): string {
    return this.catalog.find((m) => m.id === id)?.name ?? id;
  }
}
