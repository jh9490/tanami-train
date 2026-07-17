const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;

function cleanVideoId(value: string | null | undefined) {
  if (!value) return null;
  const id = value.trim().split(/[?&#/]/)[0];
  return YOUTUBE_ID_PATTERN.test(id) ? id : null;
}

export function getYouTubeVideoId(rawUrl?: string | null) {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be') {
      return cleanVideoId(url.pathname.replace(/^\/+/, ''));
    }

    if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'music.youtube.com') {
      return null;
    }

    const watchId = cleanVideoId(url.searchParams.get('v'));
    if (watchId) return watchId;

    const parts = url.pathname.split('/').filter(Boolean);
    const marker = parts.findIndex((part) =>
      ['embed', 'live', 'shorts'].includes(part.toLowerCase())
    );

    if (marker >= 0) {
      return cleanVideoId(parts[marker + 1]);
    }

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(rawUrl?: string | null) {
  const videoId = getYouTubeVideoId(rawUrl);
  if (!videoId) return null;

  const params = new URLSearchParams({
    autoplay: '0',
    controls: '0',
    disablekb: '1',
    enablejsapi: '1',
    fs: '0',
    iv_load_policy: '3',
    origin: 'https://tanamitrain.com',
    playsinline: '1',
    rel: '0',
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
