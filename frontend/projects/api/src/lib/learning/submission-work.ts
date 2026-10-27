/** The work a youth sends (L2-077 criterion 3): what the assignment accepts, the attestation, and on a resubmit whether to drop her earlier file. */
export interface SubmissionWork {
  text: string | null;
  link: string | null;
  attest: boolean;
  file: File | null;
  removeFile: boolean;
}
