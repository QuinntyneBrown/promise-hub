import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { ROLE_LABELS, SESSION_API, Session } from '@promisehub/api';
import { NavDrawerService, PhBottomNavigation, PhSkipLink, PhTopBar } from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';
import { NAVIGATION } from './navigation';

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

  protected readonly navigation = NAVIGATION;
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

  protected openMenu(session: Session): void {
    this.menuOpen.set(true);
    const ref = this.drawer.open({
      items: this.navigation,
      homeLink: '/',
      personName: session.personName,
      avatarTint: 'sky',
      context: `${ROLE_LABELS[session.role]} · ${session.organizationName}`,
    });
    ref.closed.subscribe(() => this.menuOpen.set(false));
  }

  protected search(query: string): void {
    void this.router.navigate(['/search'], { queryParams: { q: query } });
  }
}
