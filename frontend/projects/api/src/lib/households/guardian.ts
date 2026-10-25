export interface Guardian {
  id: string;
  name: string;
  relationship: string;
  mobile: string | null;
  email: string | null;
  language: string;
  isPrimary: boolean;
  canPickUp: boolean;
  canSign: boolean;
}
