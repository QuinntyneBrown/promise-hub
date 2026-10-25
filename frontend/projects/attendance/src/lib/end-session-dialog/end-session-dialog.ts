import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ATTENDANCE_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhRadioGroup, RadioOption } from '@promisehub/components';

export interface EndSessionData {
  sessionId: string;
  name: string;
  notYet: number;
  stillIn: number;
  endTime: string;
}

/** End a session (dialog: end-session): what to do with the children not checked in and those not signed out. Closes with true. */
@Component({
  selector: 'ph-end-session-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './end-session-dialog.html',
})
export class EndSessionDialog {
  private readonly api = inject(ATTENDANCE_API);
  protected readonly data = inject<EndSessionData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected notCheckedIn: 'MarkAbsent' | 'LeaveNotRecorded' = 'MarkAbsent';
  protected notSignedOut: 'SignOutAtEnd' | 'LeaveUnsigned' = 'SignOutAtEnd';
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly absentOptions: RadioOption[] = [
    { value: 'MarkAbsent', label: 'Mark absent', hint: 'Recorded as absent tonight' },
    { value: 'LeaveNotRecorded', label: 'Leave as not recorded', hint: 'A gap in the report' },
  ];
  protected readonly signOutOptions: RadioOption[] = [
    {
      value: 'SignOutAtEnd',
      label: `Sign out to a guardian at ${this.data.endTime}`,
      hint: 'Everyone left at once',
    },
    { value: 'LeaveUnsigned', label: 'Leave unsigned', hint: 'Sign out each child later' },
  ];

  protected end(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .endSession(this.data.sessionId, this.notCheckedIn, this.notSignedOut)
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(true);
        else this.failed.set(true);
      });
  }
}
