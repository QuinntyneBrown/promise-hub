/** A published lesson, quiz or assignment a mentor may assign (L2-092 criterion 1), with its module and track. */
export interface AssignWorkItem {
  id: string;
  kind: 'Lesson' | 'Quiz' | 'Assignment';
  title: string;
  moduleTitle: string;
  trackId: string;
  trackName: string;
}
