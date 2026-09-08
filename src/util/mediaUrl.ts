export const MEDIA_BASE_URL = 'https://tanamitrain.com/tanamiAdmin/common/media';

/**
 * Resolves media paths returned by the API against the public media host.
 *
 * The API can return relative paths or legacy absolute admin URLs containing
 * `/common/media/`. Both forms must point at the separate public media base.
 * Non-media absolute URLs (for example external links) are left unchanged.
 */
export function resolveMediaUrl(value?: string | null): string {
  if (!value) return '';

  const url = String(value).trim();
  if (!url) return '';

  const mediaMarker = 'common/media/';
  const markerIndex = url.toLowerCase().indexOf(mediaMarker);

  if (markerIndex >= 0) {
    const mediaPath = url.slice(markerIndex + mediaMarker.length).replace(/^\/+/, '');
    return mediaPath ? `${MEDIA_BASE_URL}/${mediaPath}` : MEDIA_BASE_URL;
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;

  return `${MEDIA_BASE_URL}/${url.replace(/^\/+/, '')}`;
}
