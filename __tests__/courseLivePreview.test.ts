import {
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
} from '../src/util/youtubeLive';

describe('YouTube live preview URL normalization', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/live/dQw4w9WgXcQ?feature=share', 'dQw4w9WgXcQ'],
    ['youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extracts the video id from %s', (url, expected) => {
    expect(getYouTubeVideoId(url)).toBe(expected);
  });

  it('creates a YouTube embed URL for supported links', () => {
    expect(getYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&controls=0&disablekb=1&enablejsapi=1&fs=0&iv_load_policy=3&origin=https%3A%2F%2Ftanamitrain.com&playsinline=1&rel=0'
    );
  });

  it.each([
    undefined,
    null,
    '',
    '   ',
    'https://example.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/channel/abc',
    'not a valid url',
  ])('returns null for unsupported input %p', (url) => {
    expect(getYouTubeVideoId(url)).toBeNull();
    expect(getYouTubeEmbedUrl(url)).toBeNull();
  });
});
