export interface ToastMessage {
  id: number;
  tone: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  text?: string;
}
