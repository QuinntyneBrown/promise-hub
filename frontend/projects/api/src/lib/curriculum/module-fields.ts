/** The module editor's details form. */
export interface ModuleFields {
  title: string;
  description: string;
  prerequisiteModuleId: string | null;
  anchor: string;
}
