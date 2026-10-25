/** Only same-app paths are followed after sign-in, never another site. */
export function safeReturnUrl(url: string | null | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/sign-in')
    ? url
    : '/';
}
