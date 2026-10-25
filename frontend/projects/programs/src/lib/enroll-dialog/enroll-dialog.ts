import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ChildMatch, HOUSEHOLDS_API, PROGRAMS_API, Program } from '@promisehub/api';
import {
  PhButton,
  PhDialog,
  PhList,
  PhListItem,
  PhTextField,
  ToastService,
} from '@promisehub/components';
import { Subject, debounceTime, map, of, switchMap } from 'rxjs';

/** Add a child to a program (dialog: enroll-in-program): search the roster, choose a child, add. Closes with true once added. */
@Component({
  selector: 'ph-enroll-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhList, PhListItem, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './enroll-dialog.html',
})
export class EnrollDialog {
  private readonly households = inject(HOUSEHOLDS_API);
  private readonly programs = inject(PROGRAMS_API);
  private readonly toasts = inject(ToastService);
  private readonly search$ = new Subject<string>();
  protected readonly program = inject<Program>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected q = '';
  protected readonly chosen = signal<ChildMatch | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly matches = toSignal(
    this.search$.pipe(
      debounceTime(150),
      switchMap((q) =>
        q.trim().length < 2
          ? of([])
          : this.households
              .findChildren(q.trim())
              .pipe(map((r) => (r.status === 'loaded' ? r.value.children : []))),
      ),
    ),
    { initialValue: [] as ChildMatch[] },
  );

  protected search(q: string): void {
    this.chosen.set(null);
    this.search$.next(q);
  }

  protected submit(): void {
    const child = this.chosen();
    if (!child) {
      this.error.set('Choose a child first.');
      return;
    }
    this.busy.set(true);
    this.programs.enroll(this.program.id, child.id).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: `${child.name} added`,
          text: this.program.name,
        });
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.error.set(outcome.errors['childId'] ?? 'We couldn’t add the child.');
      } else {
        this.error.set('We couldn’t add the child. Try again.');
      }
    });
  }
}
