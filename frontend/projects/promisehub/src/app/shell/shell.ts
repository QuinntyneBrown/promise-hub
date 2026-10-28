import { HttpErrorResponse } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  AUTH_API,
  NOTIFICATIONS_API,
  PARTICIPANT_ROLES,
  REALTIME_EVENTS,
  ROLE_LABELS,
  SESSION_API,
  Session,
} from '@promisehub/api';
import {
  NavDrawerService,
  OrgOption,
  PhBottomNavigation,
  PhSkipLink,
  PhTopBar,
} from '@promisehub/components';
import { EMPTY, catchError, filter, map, merge, startWith, switchMap } from 'rxjs';
import { navigationFor } from './navigation';

/** The staff shell: skip link, top bar, main, phone tab bar and the More drawer. */
@Component({
  selector: 'ph-shell',
  imports: [RouterOutlet, PhBottomNavigation, PhSkipLink, PhTopBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly drawer = inject(NavDrawerService);
  private readonly auth = inject(AUTH_API);
  private readonly notifications = inject(NOTIFICATIONS_API);
  private readonly sessions = inject(SESSION_API);
  private readonly document = inject(DOCUMENT);

  protected readonly menuOpen = signal(false);
  protected readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status !== 401) {
            // The API's fault answer carries a reference to its log line; the page shows it to quote (L2-041).
            const reference =
              typeof error.error?.reference === 'string' ? error.error.reference : null;
            void this.router.navigateByUrl('/server-error', {
              skipLocationChange: true,
              state: { reference },
            });
          }
          return EMPTY;
        }),
      ),
  );

  /**
   * The bell's unread count, read again after every navigation, every read here, and every notification event or (re)connection of the
   * stream, so a new notice or a read on another device shows without a reload (L2-110).
   */
  protected readonly unread = toSignal(
    merge(
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
      this.notifications.changed,
      inject(REALTIME_EVENTS)
        .events()
        .pipe(filter((e) => e.type === 'notification' || e.type === 'open')),
    ).pipe(
      startWith(null),
      switchMap(() => this.notifications.list()),
      map((r) => (r.status === 'loaded' ? r.value.unread : 0)),
    ),
    { initialValue: 0 },
  );

  /** The person's organizations for the switcher; empty or one hides it (L2-002 criterion 3). */
  protected readonly organizations = toSignal(
    this.sessions.organizations().pipe(
      map((list): OrgOption[] =>
        list.map((o) => ({
          id: o.membershipId,
          name: o.name,
          caption: ROLE_LABELS[o.role],
          active: o.active,
        })),
      ),
    ),
    { initialValue: [] as OrgOption[] },
  );

  /** Switching reloads the whole app so nothing of the previous organization stays in memory. */
  protected switchOrganization(membershipId: string): void {
    this.sessions.switchTo(membershipId).subscribe((outcome) => {
      if (outcome.status === 'saved') this.document.location.assign('/');
    });
  }

  protected openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  protected context(session: Session): string {
    return `${ROLE_LABELS[session.role]} · ${session.organizationName}`;
  }

  protected signOut(): void {
    this.auth.signOut().subscribe(() => void this.router.navigateByUrl('/signed-out'));
  }

  /** Only sections whose module is on (L2-005) and that serve the role (L2-038, ADR 0043). */
  protected readonly navigation = computed(() => {
    const s = this.session();
    return s ? navigationFor(s.modules, s.role) : [];
  });

  /** Youth, mentors and volunteers have no search (L2-038 criterion 6). */
  protected readonly searchable = computed(() => {
    const s = this.session();
    return !!s && !PARTICIPANT_ROLES.includes(s.role);
  });

  protected openMenu(session: Session): void {
    this.menuOpen.set(true);
    const ref = this.drawer.open({
      items: this.navigation(),
      homeLink: '/',
      personName: session.personName,
      avatarTint: 'sky',
      context: this.context(session),
    });
    ref.closed.subscribe(() => this.menuOpen.set(false));
  }

  protected search(query: string): void {
    void this.router.navigate(['/search'], { queryParams: { q: query } });
  }
}
