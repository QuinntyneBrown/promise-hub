/**
 * The address as the sent page shows it: the first character, four dots and the domain, so a shared phone never shows it in
 * full (L2-115 criterion 1).
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return email;
  return `${email[0]}••••${email.slice(at)}`;
}
