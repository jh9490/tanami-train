/**
 * The mobile API owns media URL construction. Keep its value byte-for-byte
 * (apart from rejecting null/blank values) and never prepend an app base URL.
 */
export function resolveMediaUrl(value?: string | null): string {
  if (!value) return '';
  return String(value);
}
