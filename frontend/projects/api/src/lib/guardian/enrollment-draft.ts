/** What the guardian has entered: the household and the children to enroll. */
export interface EnrollmentDraft {
  household: {
    guardianName: string | null;
    mobile: string | null;
    email: string | null;
    language: string | null;
  };
  children: EnrollmentChild[];
}

export interface EnrollmentChild {
  id: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  school: string | null;
  allergies: string | null;
  medication: string | null;
  enroll: boolean;
}
