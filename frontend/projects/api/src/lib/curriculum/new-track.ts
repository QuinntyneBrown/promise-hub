/** What the new-track dialog sends; a blank key is made from the name. */
export interface NewTrack {
  name: string;
  key: string;
  description: string;
  publish: boolean;
}
