import type { AssignmentBrief, SubmissionRef, SubmissionType } from '@promisehub/api';

const SHORT: Record<SubmissionType, string> = {
  Text: 'text',
  Photo: 'photo',
  Link: 'link',
  File: 'file',
};
const LONG: Record<SubmissionType, string> = {
  Text: 'a reflection',
  Photo: 'a JPG or PNG photo',
  Link: 'a link',
  File: 'a PDF, JPG or PNG file',
};

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (parts: string[]) =>
  parts.length < 2 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;

/** "Text + photo": the ways an assignment accepts, short. */
export function typesShort(types: SubmissionType[]): string {
  return capital(types.map((t) => SHORT[t]).join(' + '));
}

/** "A reflection and a JPG or PNG photo": the ways an assignment accepts, in words. */
export function typesLong(types: SubmissionType[]): string {
  return capital(list(types.map((t) => LONG[t])));
}

/** "14 days left", "Due today", "1 day late" or "Closed" under the due date. */
export function dueCaption(a: Pick<AssignmentBrief, 'dueState' | 'daysLeft'>): string {
  if (a.dueState === 'closed') return 'Closed';
  if (a.daysLeft === null) return 'Submit any time';
  if (a.dueState === 'late') return `${-a.daysLeft} day${a.daysLeft === -1 ? '' : 's'} late`;
  if (a.daysLeft > 1) return `${a.daysLeft} days left`;
  if (a.daysLeft === 1) return '1 day left';
  return a.daysLeft === 0 ? 'Due today' : 'In the grace period';
}

/** The submission's status in words, as the badges write it. */
export const SUBMISSION_LABEL: Record<SubmissionRef['status'], string> = {
  Submitted: 'Submitted',
  InReview: 'In review',
  NeedsRevision: 'Needs revision',
  Accepted: 'Accepted',
};

export const SUBMISSION_TONE: Record<SubmissionRef['status'], 'info' | 'warning' | 'success'> = {
  Submitted: 'info',
  InReview: 'info',
  NeedsRevision: 'warning',
  Accepted: 'success',
};

/** "16 bytes", "240 KB" or "1.2 MB". */
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} byte${bytes === 1 ? '' : 's'}`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** What to tell a youth whose file is refused, as the server words it. */
export function fileRefusal(types: SubmissionType[]): string {
  return types.includes('File')
    ? 'Choose a PDF, JPG or PNG file of up to 10 MB.'
    : 'Choose a JPG or PNG photo of up to 10 MB.';
}

const IMAGE = /\.(png|jpe?g)$/i;

/** Photo or File when the assignment takes this file, else null (ADR 0056); the server checks its first bytes too. */
export function fileKind(file: File, types: SubmissionType[]): 'Photo' | 'File' | null {
  if (file.size < 1 || file.size > 10 * 1024 * 1024) return null;
  const image = IMAGE.test(file.name) && /^image\/(png|jpeg)$/.test(file.type);
  const pdf = /\.pdf$/i.test(file.name) && file.type === 'application/pdf';
  if (image && types.includes('Photo')) return 'Photo';
  return (image || pdf) && types.includes('File') ? 'File' : null;
}
