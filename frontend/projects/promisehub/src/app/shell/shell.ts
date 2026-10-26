import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AUTH_API, NOTIFICATIONS_API, ROLE_LABELS, SESSION_API, Session } from '@promisehub/api';
import { NavDrawerService, PhBottomNavigation, PhSkipLink, PhTopBar } from '@promisehub/components';
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

  protected readonly menuOpen = signal(false);
  protected readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status !== 401) {
            void this.router.navigateByUrl('/server-error', { skipLocationChange: true });
          }
          return EMPTY;
        }),
      ),
  );

  /** The bell's unread count, read again after every navigation so it follows reads on any device. */
  protected readonly unread = toSignal(
    merge(
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
      this.notifications.changed,
    ).pipe(
      startWith(null),
      switchMap(() => this.notifications.list()),
      map((r) => (r.status === 'loaded' ? r.value.unread : 0)),
    ),
    { initialValue: 0 },
  );

  protected openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  protected context(session: Session): string {
    return `${ROLE_LABELS[session.role]} · ${session.organizationName}`;
  }

  protected signOut(): void {
    this.auth.signOut().subscribe(() => void this.router.navigateByUrl('/sign-in'));
  }

  /** Only sections whose module is on (L2-005). */
  protected readonly navigation = computed(() => navigationFor(this.session()?.modules ?? []));

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
