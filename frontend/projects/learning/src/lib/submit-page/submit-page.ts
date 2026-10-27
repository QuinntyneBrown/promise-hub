import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AssignmentBrief,
  DRAFT_STORE,
  GatedResult,
  SESSION_API,
  LEARNING_API,
  SubmissionType,
  SubmitOutcome,
  SubmittedFile,
} from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhCheckbox,
  PhDialogs,
  PhEmptyState,
  PhErrorSummary,
  PhFileUpload,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhTextField,
  PhTextarea,
  ToastService,
  formatDateTime,
} from '@promisehub/components';
import { Observable, Subject, combineLatest, map, of, startWith, switchMap, tap } from 'rxjs';
import { fileKind, fileRefusal, fileSize } from '../assignment-words';
import { SubmitAssignmentDialog } from '../submit-assignment-dialog/submit-assignment-dialog';
import { SubmitAssignmentDialogData } from '../submit-assignment-dialog/submit-assignment-dialog-data';
import { CanLeave } from '../can-leave';
import { LeaveChoice } from '../unsaved-changes-dialog/leave-choice';
import { UnsavedChangesDialog } from '../unsaved-changes-dialog/unsaved-changes-dialog';
import { SubmitView } from './submit-view';

const FIELD: Record<string, string> = {
  text: 'reflection',
  link: 'link',
  file: 'file',
  attest: 'attest',
};

/**
 * Writes and sends an assignment's work (mock: learn-submit, L2-077 criteria 3 to 5, L2-078 criterion 3): the reflection, link and file
 * the assignment takes and the attestation, checked here as the server checks them, then sent through submit-assignment. Revising a
 * submission sent back shows the mentor's note and her last work, keeping her file unless she removes or replaces it. Unsent work is
 * protected (L2-079): Save draft keeps the reflection and link on this device, a draft is restored on return, and leaving with unsaved
 * changes asks first through unsaved-changes.
 */
@Component({
  selector: 'ph-submit-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhCheckbox,
    PhEmptyState,
    PhErrorSummary,
    PhFileUpload,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './submit-page.html',
  styleUrl: './submit-page.css',
})
export class SubmitPage implements CanLeave {
  private readonly api = inject(LEARNING_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly drafts = inject(DRAFT_STORE);
  private readonly session = inject(SESSION_API);
  private membershipId = '';
  /** What the form held when it loaded or was last saved as a draft. */
  private readonly baseline = signal({ text: '', link: '' });
  /** Set once the work is sent, so leaving asks nothing. */
  private sentAway = false;
  private readonly refresh$ = new Subject<void>();
  protected readonly fileSize = fileSize;

  /** Route parameter: the assignment. */
  readonly id = input.required<string>();

  protected readonly text = signal('');
  protected readonly link = signal('');
  protected readonly attest = signal(false);
  /** A newly chosen file. */
  protected readonly file = signal<File | null>(null);
  /** The file of the submission being revised, kept unless removed or replaced. */
  protected readonly kept = signal<SubmittedFile | null>(null);
  protected readonly refused = signal<string | null>(null);
  /** When the restored draft was saved, while it shows. */
  protected readonly restored = signal<string | null>(null);
  protected readonly dirty = computed(
    () => this.text() !== this.baseline().text || this.link() !== this.baseline().link,
  );
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({
      field: FIELD[key] ?? key,
      message,
    })),
  );

  /** Null while loading. */
  protected readonly result = toSignal<GatedResult<SubmitView> | null>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            combineLatest([this.api.assignment(id), this.session.current()]).pipe(
              tap(([, me]) => (this.membershipId = me.membershipId)),
              switchMap(([r]) => this.withRevision(r)),
              tap((r) => {
                if (r.status === 'loaded') this.fill(r.value);
              }),
              startWith<GatedResult<SubmitView> | null>(null),
            ),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  private withRevision(r: GatedResult<AssignmentBrief>) {
    if (r.status !== 'loaded') return of(r as GatedResult<SubmitView>);
    const sent = r.value.submission;
    if (sent?.status !== 'NeedsRevision') {
      return of<GatedResult<SubmitView>>({
        status: 'loaded',
        value: { brief: r.value, revising: null },
      });
    }
    return this.api
      .submission(sent.id)
      .pipe(
        map((s): GatedResult<SubmitView> =>
          s.status === 'loaded'
            ? { status: 'loaded', value: { brief: r.value, revising: s.value } }
            : (s as GatedResult<SubmitView>),
        ),
      );
  }

  private fill(v: SubmitView): void {
    const draft =
      this.alreadySent(v) || this.closed(v)
        ? null
        : this.drafts.load(this.membershipId, v.brief.id);
    this.text.set(draft?.text ?? v.revising?.text ?? '');
    this.link.set(draft?.link ?? v.revising?.link ?? '');
    this.baseline.set({ text: this.text(), link: this.link() });
    this.restored.set(draft ? formatDateTime(draft.savedAt) : null);
    this.kept.set(v.revising?.file ?? null);
    this.file.set(null);
    this.attest.set(false);
  }

  protected saveDraft(v: SubmitView): void {
    this.keepDraft(v.brief.id);
    this.toasts.show({
      tone: 'success',
      title: 'Draft saved',
      text: 'On this device. Your photo isn’t saved in a draft.',
    });
  }

  private keepDraft(assignmentId: string): void {
    this.drafts.save(this.membershipId, assignmentId, {
      text: this.text(),
      link: this.link(),
      savedAt: new Date().toISOString(),
    });
    this.baseline.set({ text: this.text(), link: this.link() });
  }

  protected startOver(v: SubmitView): void {
    this.drafts.clear(this.membershipId, v.brief.id);
    this.text.set(v.revising?.text ?? '');
    this.link.set(v.revising?.link ?? '');
    this.baseline.set({ text: this.text(), link: this.link() });
    this.restored.set(null);
  }

  /** Asks before the router leaves unsent changes (L2-079 criterion 1). */
  canLeave(): Observable<boolean> | boolean {
    const r = this.result();
    if (this.sentAway || !this.dirty() || r?.status !== 'loaded') return true;
    const assignmentId = r.value.brief.id;
    return this.dialogs
      .open<LeaveChoice, null, UnsavedChangesDialog>(UnsavedChangesDialog, null)
      .closed.pipe(
        map((choice) => {
          if (choice === 'save') this.keepDraft(assignmentId);
          return choice === 'save' || choice === 'discard';
        }),
      );
  }

  /** Closing or reloading the tab with unsent changes: the browser asks (L2-079 criterion 1). */
  @HostListener('window:beforeunload', ['$event'])
  protected warn(event: BeforeUnloadEvent): void {
    if (!this.sentAway && this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  /** Read only while with the mentor: there is nothing to submit here. */
  protected alreadySent(v: SubmitView): boolean {
    return !!v.brief.submission && !v.revising;
  }

  protected closed(v: SubmitView): boolean {
    return !v.brief.submission && v.brief.dueState === 'closed';
  }

  protected takes(v: SubmitView, type: SubmissionType): boolean {
    return v.brief.submissionTypes.includes(type);
  }

  protected takesFiles(v: SubmitView): boolean {
    return this.takes(v, 'Photo') || this.takes(v, 'File');
  }

  protected mentor(v: SubmitView): string {
    return v.brief.mentorName ?? 'your mentor';
  }

  protected subtitle(v: SubmitView): string {
    if (v.revising) return `Update your work and send it to ${this.mentor(v)} again.`;
    const what = [
      this.takes(v, 'Text') ? 'reflection' : null,
      this.takes(v, 'Link') ? 'link' : null,
      this.takes(v, 'Photo') ? 'photo' : this.takes(v, 'File') ? 'file' : null,
    ].filter(Boolean);
    const list =
      what.length < 2 ? what.join('') : `${what.slice(0, -1).join(', ')} and ${what.at(-1)}`;
    return `Add your ${list}, then send it to ${this.mentor(v)}.`;
  }

  protected fileTitle(v: SubmitView): string {
    return this.takes(v, 'Photo') && !this.takes(v, 'File') ? 'Add your photo' : 'Add your file';
  }

  protected fileText(v: SubmitView): string {
    return this.takes(v, 'File')
      ? 'PDF, JPG or PNG · up to 10 MB.'
      : 'JPG or PNG · up to 10 MB. No faces needed: the moment or the result is perfect.';
  }

  protected accept(v: SubmitView): string {
    return this.takes(v, 'File') ? 'application/pdf,image/jpeg,image/png' : 'image/jpeg,image/png';
  }

  /** The chosen or kept file as one row, or null. */
  protected chosen(v: SubmitView): { name: string; meta: string } | null {
    const f = this.file();
    if (f) {
      const kind = fileKind(f, v.brief.submissionTypes) ?? 'File';
      return { name: f.name, meta: `${kind} · ${fileSize(f.size)}` };
    }
    const k = this.kept();
    return k
      ? { name: k.name, meta: `${k.kind} · ${fileSize(k.bytes)} · from your last submission` }
      : null;
  }

  protected choose(v: SubmitView, file: File): void {
    if (!fileKind(file, v.brief.submissionTypes)) {
      this.refused.set(file.name);
      this.errors.update((e) => ({ ...e, file: fileRefusal(v.brief.submissionTypes) }));
      return;
    }
    this.refused.set(null);
    this.errors.update((e) => {
      const rest = { ...e };
      delete rest['file'];
      return rest;
    });
    this.file.set(file);
  }

  protected removeFile(): void {
    this.file.set(null);
    this.kept.set(null);
  }

  /** The checks the server makes, so a youth sees every problem at once without a round trip. */
  private check(v: SubmitView): Record<string, string> {
    const errors: Record<string, string> = {};
    const text = this.text().trim();
    const link = this.link().trim();
    const hasFile = !!this.file() || !!this.kept();
    if (text.length > 5000) errors['text'] = 'Keep your reflection under 5,000 characters.';
    if (link.length > 500) errors['link'] = 'Keep the link under 500 characters.';
    else if (link && !/^https?:\/\/\S+$/i.test(link))
      errors['link'] = 'Enter a full web address starting with http:// or https://.';
    if (!text && !link && !hasFile) {
      if (this.takes(v, 'Text')) errors['text'] = 'Write your reflection.';
      else if (this.takes(v, 'Photo')) errors['file'] = 'Add your photo.';
      else if (this.takes(v, 'File')) errors['file'] = 'Add your file.';
      else errors['link'] = 'Add your link.';
    }
    if (!this.attest()) errors['attest'] = 'Confirm this is your own work.';
    return errors;
  }

  /** "your reflection and 1 photo". */
  private sending(): string {
    const parts = [
      this.text().trim() ? 'reflection' : null,
      this.link().trim() ? 'link' : null,
      this.file() || this.kept() ? `1 ${(this.chosenKind() ?? 'file').toLowerCase()}` : null,
    ].filter(Boolean) as string[];
    const list =
      parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
    return `your ${list}`;
  }

  private chosenKind(): string | null {
    return this.kept()?.kind ?? (this.file() ? 'Photo' : null);
  }

  protected submit(v: SubmitView): void {
    const errors = this.check(v);
    this.errors.set(errors);
    if (Object.keys(errors).length) return;
    this.refused.set(null);
    const revising = v.revising;
    this.dialogs
      .open<SubmitOutcome, SubmitAssignmentDialogData, SubmitAssignmentDialog>(
        SubmitAssignmentDialog,
        {
          assignmentId: v.brief.id,
          submissionId: revising?.id ?? null,
          title: v.brief.title,
          mentorName: v.brief.mentorName,
          summary: revising ? this.sending().replace('your ', 'your revised ') : this.sending(),
          work: {
            text: this.text().trim() || null,
            link: this.link().trim() || null,
            attest: true,
            file: this.file(),
            removeFile: !!revising?.file && !this.kept() && !this.file(),
          },
        },
      )
      .closed.subscribe((outcome) => this.sent(v, outcome));
  }

  private sent(v: SubmitView, outcome: SubmitOutcome | undefined): void {
    if (!outcome) return;
    if (outcome.status === 'saved') {
      this.drafts.clear(this.membershipId, v.brief.id);
      this.sentAway = true;
      this.toasts.show({
        tone: 'success',
        title: v.revising ? 'Resubmitted' : 'Submitted',
        text: v.brief.title,
      });
      void this.router.navigate(['/learning/submissions', outcome.id]);
    } else if (outcome.status === 'invalid') {
      this.errors.set(outcome.errors);
    } else {
      this.reload();
    }
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
