import { MEDIA_BASE_URL, resolveMediaUrl } from '../src/util/mediaUrl';

describe('resolveMediaUrl', () => {
  it('moves API relative media paths to the public media base', () => {
    expect(resolveMediaUrl('/common/media/sliders/example.jpg')).toBe(
      `${MEDIA_BASE_URL}/sliders/example.jpg`,
    );
  });

  it('rewrites legacy absolute admin media URLs', () => {
    expect(
      resolveMediaUrl('https://admin.tanamitrain.com/common/media/gallery/example.jpg'),
    ).toBe(`${MEDIA_BASE_URL}/gallery/example.jpg`);
  });

  it('does not duplicate the public media prefix', () => {
    expect(
      resolveMediaUrl('https://tanamitrain.com/tanamiAdmin/common/media/gallery/example.jpg'),
    ).toBe(`${MEDIA_BASE_URL}/gallery/example.jpg`);
  });

  it('resolves bare media paths', () => {
    expect(resolveMediaUrl('activities/example.jpg')).toBe(
      `${MEDIA_BASE_URL}/activities/example.jpg`,
    );
  });

  it('preserves unrelated absolute URLs and empty values', () => {
    expect(resolveMediaUrl('https://cdn.example.com/example.jpg')).toBe(
      'https://cdn.example.com/example.jpg',
    );
    expect(resolveMediaUrl(null)).toBe('');
  });
});
