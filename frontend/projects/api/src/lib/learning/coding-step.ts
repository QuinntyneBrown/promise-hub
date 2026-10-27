/** One step of a coding lesson: instructions, a code sample and the checklist item it ticks. */
export interface CodingStep {
  id: string;
  title: string;
  instructions: string;
  sample: string | null;
  checkLabel: string;
}
