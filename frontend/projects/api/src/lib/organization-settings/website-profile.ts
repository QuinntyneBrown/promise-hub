/** Public website's defaults (L2-126): the address after /site/, a tagline, about and public email; null until written. */
export interface WebsiteProfile {
  slug: string | null;
  tagline: string | null;
  about: string | null;
  contactEmail: string | null;
}
