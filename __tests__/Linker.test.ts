import { Alert, Linking } from 'react-native';

import { openLinkSafe } from '../src/util/Linker';

describe('openLinkSafe', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens a web URL directly without an Android canOpenURL preflight', async () => {
    const canOpenSpy = jest.spyOn(Linking, 'canOpenURL');
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await openLinkSafe('https://whatsapp.com/channel/example');

    expect(canOpenSpy).not.toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith('https://whatsapp.com/channel/example');
  });

  it('adds HTTPS when a web address has no protocol', async () => {
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await openLinkSafe('www.google.com/maps');

    expect(openSpy).toHaveBeenCalledWith('https://www.google.com/maps');
  });

  it('shows a useful message when the operating system cannot open the link', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('No handler'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await openLinkSafe('https://example.com');

    expect(alertSpy).toHaveBeenCalledWith(
      'تعذر فتح الرابط',
      'يرجى المحاولة لاحقًا أو التأكد من وجود متصفح محدث على جهازك.',
    );
  });
});
