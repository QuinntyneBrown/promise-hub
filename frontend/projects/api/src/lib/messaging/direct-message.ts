/** One message as the reader sees it: plain text, who sent it, whether it is hers and when. */
export interface DirectMessage {
  id: string;
  body: string;
  from: string;
  mine: boolean;
  sentAt: string;
}
