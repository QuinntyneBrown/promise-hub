/** What the public contact page sends (L2-134 criterion 1). */
export interface ContactMessage {
  name: string;
  email: string;
  topic: string;
  message: string;
}
