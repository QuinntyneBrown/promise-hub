/** What a visitor may read about an organization: published facts only. */
export interface PublicSite {
  name: string;
  city: string;
  /** The website profile (L2-126); null until written. */
  tagline: string | null;
  about: string | null;
  email: string | null;
}
