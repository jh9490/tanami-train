import { Alert } from 'react-native';
import {
  compareVersions,
  GOOGLE_PLAY_URL,
  getApkDownloadUrl,
  checkAndPromptForUpdate,
  parseVersion,
} from '../src/util/appUpdate';
import { api } from '../src/services/api';
import * as Linker from '../src/util/Linker';

jest.mock('../src/services/api', () => ({
  api: {
    checkForUpdate: jest.fn(),
  },
}));

describe('appUpdate utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linker, 'openLinkSafe').mockImplementation(() => Promise.resolve());
  });

  describe('parseVersion', () => {
    it('parses semver strings into numbers', () => {
      expect(parseVersion('1.1.11')).toEqual([1, 1, 11]);
      expect(parseVersion('v1.0.10')).toEqual([1, 0, 10]);
      expect(parseVersion(' 2.0.0 ')).toEqual([2, 0, 0]);
    });
  });

  describe('compareVersions', () => {
    it('returns 1 when server version is greater than local', () => {
      expect(compareVersions('1.1.11', '1.1.10')).toBe(1);
      expect(compareVersions('1.1.11', '1.0.11')).toBe(1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    it('returns 0 when versions are equal', () => {
      expect(compareVersions('1.1.11', '1.1.11')).toBe(0);
      expect(compareVersions('v1.1.11', '1.1.11')).toBe(0);
    });

    it('returns -1 when server version is older', () => {
      expect(compareVersions('1.1.9', '1.1.10')).toBe(-1);
    });
  });

  describe('getApkDownloadUrl', () => {
    it('uses the remote URL provided by the API when available', () => {
      expect(
        getApkDownloadUrl(
          '1.1.11',
          'https://tanamitrain.com/downloads/TanamiTrain_v1.1.11.apk',
        ),
      ).toBe('https://tanamitrain.com/downloads/TanamiTrain_v1.1.11.apk');
    });

    it('falls back to generated APK link when remoteUrl is not provided', () => {
      expect(getApkDownloadUrl('1.1.11')).toBe(
        'https://tanamitrain.com/downloads/TanamiTrain_v1.1.11.apk',
      );
      expect(getApkDownloadUrl('v1.2.0')).toBe(
        'https://tanamitrain.com/downloads/TanamiTrain_v1.2.0.apk',
      );
    });
  });

  describe('checkAndPromptForUpdate', () => {
    it('uses dynamic url from server response when available', async () => {
      (api.checkForUpdate as jest.Mock).mockResolvedValueOnce({
        current_version: '1.1.11',
        url: 'https://tanamitrain.com/downloads/TanamiTrain_v1.1.11.apk',
      });

      const result = await checkAndPromptForUpdate('1.1.10');
      expect(result.hasUpdate).toBe(true);
      expect(result.remoteVersion).toBe('1.1.11');
      expect(result.downloadUrl).toBe(
        'https://tanamitrain.com/downloads/TanamiTrain_v1.1.11.apk',
      );
    });

    it('shows update alert and opens download link on confirm when update is available', async () => {
      (api.checkForUpdate as jest.Mock).mockResolvedValueOnce({
        current_version: '1.1.11',
      });

      const result = await checkAndPromptForUpdate('1.1.10');
      expect(result.hasUpdate).toBe(true);
      expect(result.remoteVersion).toBe('1.1.11');
      expect(result.downloadUrl).toBe(
        'https://tanamitrain.com/downloads/TanamiTrain_v1.1.11.apk',
      );

      expect(Alert.alert).toHaveBeenCalledWith(
        'تحديث جديد متوفر',
        expect.stringContaining('1.1.11'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'لاحقاً' }),
          expect.objectContaining({ text: 'تحميل مباشر' }),
          expect.objectContaining({ text: 'Google Play' }),
        ]),
      );

      // Trigger the download callback
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const downloadBtn = buttons.find((b: any) => b.text === 'تحميل مباشر');
      downloadBtn.onPress();

      expect(Linker.openLinkSafe).toHaveBeenCalledWith(
        'https://tanamitrain.com/downloads/TanamiTrain_v1.1.11.apk',
      );

      const storeBtn = buttons.find((b: any) => b.text === 'Google Play');
      storeBtn.onPress();
      expect(Linker.openLinkSafe).toHaveBeenCalledWith(GOOGLE_PLAY_URL);
    });

    it('stays silent when an automatic check finds no update', async () => {
      (api.checkForUpdate as jest.Mock).mockResolvedValueOnce({current_version: '1.1.13'});

      await checkAndPromptForUpdate('1.1.13', {showUpToDate: false});

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('shows up-to-date alert when already on latest version', async () => {
      (api.checkForUpdate as jest.Mock).mockResolvedValueOnce({
        current_version: '1.1.11',
      });

      const result = await checkAndPromptForUpdate('1.1.11');
      expect(result.hasUpdate).toBe(false);

      expect(Alert.alert).toHaveBeenCalledWith(
        'التطبيق محدث',
        expect.stringContaining('1.1.11'),
        expect.any(Array),
      );
      expect(Linker.openLinkSafe).not.toHaveBeenCalled();
    });

    it('throws error when server returns invalid version', async () => {
      (api.checkForUpdate as jest.Mock).mockResolvedValueOnce({});

      await expect(checkAndPromptForUpdate('1.1.11')).rejects.toThrow(
        'Invalid version received from server',
      );
    });
  });
});
