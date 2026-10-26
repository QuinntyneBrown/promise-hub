/** One organization in the top bar's switcher: its name, the person's role there, and whether it is active. */
export interface OrgOption {
  id: string;
  name: string;
  caption: string;
  active: boolean;
}
