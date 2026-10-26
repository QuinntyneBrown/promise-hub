import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadResult, PLATFORM_API, PlatformOrganization } from '@promisehub/api';
import {
  PhButton,
  PhCard,
  PhChip,
  PhEmptyState,
  PhPageHeader,
  PhSkeleton,
  PhTable,
  PhTextField,
  TableCell,
  TableColumn,
  ToastService,
} from '@promisehub/components';
import { AddOrganizationDialog } from '../add-organization-dialog/add-organization-dialog';
import { SuspendOrganizationDialog } from '../suspend-organization-dialog/suspend-organization-dialog';

type Filter = 'all' | 'Standard' | 'Free' | 'SettingUp' | 'Suspended';

/** The platform admin's organizations (mock: organizations): every tenant with plan, size, modules and status. */
@Component({
  selector: 'ph-organizations-page',
  imports: [
    FormsModule,
    PhButton,
    PhCard,
    PhChip,
    PhEmptyState,
    PhPageHeader,
    PhSkeleton,
    PhTable,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations-page.html',
  styleUrl: './organizations-page.css',
})
export class OrganizationsPage {
  private readonly api = inject(PLATFORM_API);
  private readonly dialog = inject(Dialog);
  private readonly toasts = inject(ToastService);

  protected readonly result = signal<LoadResult<{
    organizations: PlatformOrganization[];
  }> | null>(null);
  protected readonly query = signal('');
  protected readonly filter = signal<Filter>('all');
  protected readonly all = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.organizations : null;
  });
  protected readonly counts = computed(() => {
    const all = this.all() ?? [];
    return {
      all: all.length,
      Standard: all.filter((o) => o.plan === 'Standard').length,
      Free: all.filter((o) => o.plan === 'Free').length,
      SettingUp: all.filter((o) => o.status === 'SettingUp').length,
      Suspended: all.filter((o) => o.status === 'Suspended').length,
    };
  });
  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    return (this.all() ?? [])
      .filter((o) => !q || o.name.toLowerCase().includes(q))
      .filter((o) => f === 'all' || o.plan === f || o.status === f);
  });
  protected readonly rows = computed(() =>
    this.visible().map((o): Record<string, TableCell> => ({
      name: o.name,
      plan: o.plan,
      children: o.activeChildren.toLocaleString('en-US'),
      modules: `${o.modulesOn} of 8`,
      status:
        o.status === 'Active'
          ? { text: 'Active', tone: 'success' }
          : o.status === 'SettingUp'
            ? { text: 'Setting up', tone: 'info' }
            : { text: 'Suspended', tone: 'danger' },
    })),
  );
  protected readonly subtitle = computed(() => {
    const all = this.all() ?? [];
    const children = all.reduce((n, o) => n + o.activeChildren, 0);
    return `${all.length} ${all.length === 1 ? 'organization' : 'organizations'} · ${children.toLocaleString('en-US')} active children · ${this.counts().Standard} on Standard`;
  });
  protected readonly columns: TableColumn[] = [
    { key: 'name', label: 'Organization' },
    { key: 'plan', label: 'Plan' },
    { key: 'children', label: 'Children' },
    { key: 'modules', label: 'Modules' },
    { key: 'status', label: 'Status' },
  ];

  constructor() {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.organizations().subscribe((r) => this.result.set(r));
  }

  protected add(): void {
    this.dialog.open<boolean>(AddOrganizationDialog).closed.subscribe((added) => {
      if (added) this.load();
    });
  }

  protected suspend(organization: PlatformOrganization): void {
    this.dialog
      .open<boolean>(SuspendOrganizationDialog, { data: organization })
      .closed.subscribe((done) => {
        if (!done) return;
        this.toasts.show({ tone: 'success', title: `${organization.name} suspended` });
        this.load();
      });
  }

  protected reinstate(organization: PlatformOrganization): void {
    this.api.reinstate(organization.id).subscribe((r) => {
      if (r.status === 'saved') {
        this.toasts.show({ tone: 'success', title: `${organization.name} reinstated` });
        this.load();
      } else {
        this.toasts.show({ tone: 'danger', title: 'Couldn’t reinstate', text: 'Try again.' });
      }
    });
  }
}
