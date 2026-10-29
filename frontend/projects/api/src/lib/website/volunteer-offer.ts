/** What Sign up to volunteer sends (L2-134 criterion 2). */
export interface VolunteerOffer {
  name: string;
  email: string;
  phone: string | null;
  area: string;
  about: string | null;
  screeningAcknowledged: boolean;
}
