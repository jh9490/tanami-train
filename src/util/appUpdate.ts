import { Alert } from 'react-native';
import { openLinkSafe } from './Linker';
import { api } from '../services/api';
import {CURRENT_APP_VERSION} from '../constants/appMetadata';

export {CURRENT_APP_VERSION} from '../constants/appMetadata';

export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.tanamitrain';

type UpdatePromptOptions = {
  showUpToDate?: boolean;
};

export function parseVersion(version: string): number[] {
  return version
    .trim()
    .replace(/^v/i, '')
    .split(/[.+-]/)
    .map(part => {
      const value = Number.parseInt(part, 10);
      return Number.isFinite(value) ? value : 0;
    });
}

/**
 * Compares two semantic version strings.
 * Returns:
 *  1 if v1 > v2
 * -1 if v1 < v2
 *  0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);
  const length = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < length; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

export function getApkDownloadUrl(version: string, remoteUrl?: string): string {
  if (remoteUrl && typeof remoteUrl === 'string' && remoteUrl.trim()) {
    return remoteUrl.trim();
  }
  const cleanVersion = version.trim().replace(/^v/i, '');
  return `https://tanamitrain.com/downloads/TanamiTrain_v${cleanVersion}.apk`;
}

export async function checkAndPromptForUpdate(
  currentVersion: string = CURRENT_APP_VERSION,
  options: UpdatePromptOptions = {},
): Promise<{ hasUpdate: boolean; remoteVersion: string; downloadUrl: string }> {
  const data = await api.checkForUpdate();
  const rawRemote = data?.current_version?.trim();
  const rawUrl = data?.url?.trim() || data?.download_url?.trim();

  if (!rawRemote) {
    throw new Error('Invalid version received from server');
  }

  const cleanRemote = rawRemote.replace(/^v/i, '');
  const hasUpdate = compareVersions(cleanRemote, currentVersion) > 0;
  const downloadUrl = getApkDownloadUrl(cleanRemote, rawUrl);
  const storeUrl = data?.play_store_url?.trim() || data?.store_url?.trim() || GOOGLE_PLAY_URL;

  if (hasUpdate) {
    Alert.alert(
      'تحديث جديد متوفر',
      `يتوفر إصدار جديد من التطبيق (${cleanRemote}).\nهل ترغب في تحميل التحديث الآن؟`,
      [
        { text: 'لاحقاً', style: 'cancel' },
        {
          text: 'تحميل مباشر',
          onPress: () => {
            openLinkSafe(downloadUrl);
          },
        },
        {
          text: 'Google Play',
          onPress: () => {
            openLinkSafe(storeUrl);
          },
        },
      ],
    );
  } else if (options.showUpToDate !== false) {
    Alert.alert(
      'التطبيق محدث',
      `أنت تستخدم أحدث إصدار من التطبيق (${currentVersion}).`,
      [{ text: 'حسناً' }],
    );
  }

  return { hasUpdate, remoteVersion: cleanRemote, downloadUrl };
}
