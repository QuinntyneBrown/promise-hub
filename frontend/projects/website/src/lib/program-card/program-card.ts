import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PublicProgram } from '@promisehub/api';
import {
  Fact,
  PhBadge,
  PhButton,
  PhCard,
  PhDescriptionList,
  formatDate,
} from '@promisehub/components';

const SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** One current program on the public website (mocks: site-landing, site-programs; L2-133 criterion 1): when, who, the dates and Apply. */
@Component({
  selector: 'ph-program-card',
  imports: [PhBadge, PhButton, PhCard, PhDescriptionList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './program-card.html',
  styleUrl: './program-card.css',
})
export class ProgramCard {
  readonly program = input.required<PublicProgram>();

  protected readonly status = computed(() => {
    const p = this.program();
    return p.status === 'Running'
      ? 'Running now'
      : `Starts ${SHORT.format(new Date(`${p.startsOn}T12:00:00Z`))}`;
  });

  protected readonly facts = computed<Fact[]>(() => {
    const p = this.program();
    const facts: Fact[] = [];
    if (p.schedule) facts.push({ key: 'when', term: 'When', value: p.schedule });
    if (p.ages) facts.push({ key: 'who', term: 'Who', value: `Ages ${p.ages}` });
    facts.push({
      key: 'runs',
      term: 'Runs',
      value: `${formatDate(p.startsOn)} – ${formatDate(p.endsOn)}`,
    });
    if (p.track) facts.push({ key: 'track', term: 'Learning track', value: p.track });
    if (p.leadMentor) facts.push({ key: 'mentor', term: 'Lead mentor', value: p.leadMentor });
    return facts;
  });
}
