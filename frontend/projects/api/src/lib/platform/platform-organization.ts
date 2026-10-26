/** One tenant in the platform admin's list (L2-003). */
export interface PlatformOrganization {
  id: string;
  name: string;
  plan: 'Free' | 'Standard' | 'Plus';
  activeChildren: number;
  modulesOn: number;
  status: 'Active' | 'SettingUp' | 'Suspended';
  suspensionReason: string | null;
}
