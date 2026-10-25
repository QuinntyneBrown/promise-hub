export interface ProgramSummary {
  id: string;
  name: string;
  schedule: string | null;
  startsOn: string;
  endsOn: string;
  enrolled: number;
  capacity: number;
  enrollmentOpen: boolean;
  status: 'Active' | 'Archived';
}
