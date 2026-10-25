/** The new-incident form's choices: the children and the supervisor the report goes to. */
export interface IncidentForm {
  supervisor: string | null;
  children: { id: string; name: string }[];
}
