/** One message in a message thread: its words, who and when in words, whether it is the reader's own, and how it is going. */
export interface ThreadMessage {
  id: string;
  body: string;
  /** "Sofía · 3:58 pm", "You · Sending…". */
  meta: string;
  mine: boolean;
  /** A day separator shown before this message, such as "Today". */
  day?: string | null;
  /** Sending and failed are the reader's own unsent messages; new is one that just arrived. */
  state?: 'sending' | 'failed' | 'new' | null;
}
