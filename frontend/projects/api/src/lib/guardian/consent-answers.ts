/** A typed signature on the consent page: the name, the relationship (Parent, Legal guardian…) and the ticked box. */
export interface ConsentAnswers {
  name: string;
  relationship: string;
  agree: boolean;
}
