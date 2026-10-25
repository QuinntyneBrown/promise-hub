import type { SlipChannel } from './slip-channel';
import type { SlipReminders } from './slip-reminders';

/** What a director writes on a slip. */
export interface SlipFields {
  title: string;
  body: string;
  signBy: string;
  askPhotos: boolean;
  askSwimming: boolean;
  askLunch: boolean;
  reminders: SlipReminders;
  channel: SlipChannel;
}
