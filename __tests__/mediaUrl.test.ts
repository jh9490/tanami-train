import { resolveMediaUrl } from '../src/util/mediaUrl';

describe('resolveMediaUrl', () => {
  it('uses API media URLs exactly as returned', () => {
    const url = 'https://tanamitrain.com/tanamiAdmin/common/media/gallery/example.jpg';
    expect(resolveMediaUrl(url)).toBe(url);
  });

  it('does not prepend a base URL to relative values', () => {
    expect(resolveMediaUrl('activities/example.jpg')).toBe('activities/example.jpg');
  });

  it('preserves empty values', () => {
    expect(resolveMediaUrl(null)).toBe('');
  });
});
