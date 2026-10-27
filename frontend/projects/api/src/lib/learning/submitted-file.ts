/** The file a youth sent: its name as she chose it, Photo or File, and its size in bytes. */
export interface SubmittedFile {
  name: string;
  kind: 'Photo' | 'File';
  bytes: number;
}
