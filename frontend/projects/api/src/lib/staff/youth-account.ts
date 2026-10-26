/** The Youth account card on a child record (L2-051): none, an invitation waiting, or an active account. */
export interface YouthAccount {
  status: 'None' | 'Invited' | 'Active';
  name: string | null;
  email: string | null;
  expiresAt: string | null;
}
