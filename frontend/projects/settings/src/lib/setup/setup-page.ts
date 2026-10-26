import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadResult, SESSION_API, SETUP_API, Setup } from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhProgressBar,
  PhSkeleton,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, startWith, switchMap } from 'rxjs';

interface StepCopy {
  title: string;
  meta: string;
  link: string;
  module?: 'Slips';
}

const STEPS: Record<Setup['steps'][number]['key'], StepCopy> = {
  organization: {
    title: 'Name your organization',
    meta: 'The name families see.',
    link: '/setup/organization',
  },
  modules: {
    title: 'Choose your modules',
    meta: 'Switch on what you need.',
    link: '/settings/modules',
  },
  program: {
    title: 'Create your first program',
    meta: 'Its schedule and capacity.',
    link: '/programs/new',
    module: 'Slips',
  },
  children: {
    title: 'Import your children',
    meta: 'From a spreadsheet, about ten minutes.',
    link: '/import',
  },
  staff: {
    title: 'Invite the staff who run sessions',
    meta: 'They check in on their phones.',
    link: '/settings/staff',
  },
  slip: {
    title: 'Send your first permission slip',
    meta: 'Create an event, write the slip, send.',
    link: '/events',
    module: 'Slips',
  },
};

/** Set up (mock: setup): the checklist of setup steps, done or next; leave any time and come back here. */
@Component({
  selector: 'ph-setup-page',
  imports: [
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhProgressBar,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './setup-page.html',
  styleUrl: './setup.css',
})
export class SetupPage {
  private readonly api = inject(SETUP_API);
  private readonly retry$ = new Subject<void>();
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  protected readonly result = toSignal(
    this.retry$.pipe(
      startWith(undefined),
      switchMap(() => this.api.checklist().pipe(startWith<LoadResult<Setup> | null>(null))),
    ),
    { initialValue: null },
  );
  protected readonly setup = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });
  protected readonly firstName = computed(() => this.session()?.personName.split(' ')[0] ?? '');

  protected copy(key: Setup['steps'][number]['key']): StepCopy {
    return STEPS[key];
  }

  /** A step's screen, or null when its module is off. */
  protected link(key: Setup['steps'][number]['key']): string | null {
    const c = STEPS[key];
    return !c.module || this.session()?.modules.includes(c.module) ? c.link : null;
  }

  protected done(s: Setup): number {
    return s.steps.filter((x) => x.done).length;
  }

  protected retry(): void {
    this.retry$.next();
  }
}
