import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CURRICULUM_API,
  LoadResult,
  Progression,
  ProgressionCompetency,
  ProgressionStage,
} from '@promisehub/api';
import {
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  ToastService,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { ProgressionCompetencyDialog } from '../progression-competency-dialog/progression-competency-dialog';
import { ProgressionCompetencyDialogData } from '../progression-competency-dialog/progression-competency-dialog-data';
import { ProgressionStageDialog } from '../progression-stage-dialog/progression-stage-dialog';
import { ProgressionStageDialogData } from '../progression-stage-dialog/progression-stage-dialog-data';
import { RemoveCompetencyDialog } from '../remove-competency-dialog/remove-competency-dialog';
import { RemoveCompetencyDialogData } from '../remove-competency-dialog/remove-competency-dialog-data';

/**
 * The progression framework (mock: curriculum-progression, L2-086): each stage in order with the competencies that earn it, reordered
 * with Move up and Move down, and how youth advance.
 */
@Component({
  selector: 'ph-progression-page',
  imports: [
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progression-page.html',
})
export class ProgressionPage {
  private readonly api = inject(CURRICULUM_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.progression().pipe(startWith<LoadResult<Progression> | null>(null))),
    ),
    { initialValue: null },
  );

  protected reload(): void {
    this.refresh$.next();
  }

  protected addStage(): void {
    this.dialogs
      .open<string, ProgressionStageDialogData, ProgressionStageDialog>(ProgressionStageDialog, {})
      .closed.subscribe((name) => {
        if (!name) return;
        this.toasts.show({ tone: 'success', title: 'Stage added', text: name });
        this.reload();
      });
  }

  protected editStage(stage: ProgressionStage): void {
    this.dialogs
      .open<string, ProgressionStageDialogData, ProgressionStageDialog>(ProgressionStageDialog, {
        stage,
      })
      .closed.subscribe((name) => {
        if (!name) return;
        this.toasts.show({ tone: 'success', title: 'Stage saved', text: name });
        this.reload();
      });
  }

  protected move(stages: ProgressionStage[], index: number, by: -1 | 1): void {
    const ids = stages.map((s) => s.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + by, 0, moved!);
    this.api.reorderStages(ids).subscribe((outcome) => {
      if (outcome.status === 'saved') {
        this.reload();
      } else {
        this.toasts.show({ tone: 'danger', title: 'The order was not saved', text: 'Try again.' });
      }
    });
  }

  protected addCompetency(stage: ProgressionStage): void {
    this.dialogs
      .open<string, ProgressionCompetencyDialogData, ProgressionCompetencyDialog>(
        ProgressionCompetencyDialog,
        { stageId: stage.id, stageName: stage.name },
      )
      .closed.subscribe((name) => {
        if (!name) return;
        this.toasts.show({ tone: 'success', title: 'Competency added', text: name });
        this.reload();
      });
  }

  protected remove(competency: ProgressionCompetency): void {
    this.dialogs
      .open<boolean, RemoveCompetencyDialogData, RemoveCompetencyDialog>(RemoveCompetencyDialog, {
        id: competency.id,
        name: competency.name,
      })
      .closed.subscribe((removed) => {
        if (!removed) return;
        this.toasts.show({
          tone: 'success',
          title: 'Competency removed',
          text: `${competency.name}. Earlier assessments are kept.`,
        });
        this.reload();
      });
  }
}
