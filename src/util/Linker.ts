import { Alert, Linking } from 'react-native';

const ensureHttp = (url: string) => {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export async function openLinkSafe(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    Alert.alert('تعذّر فتح الرابط', 'الرابط غير متوفر حالياً.');
    return;
  }

  const url = ensureHttp(trimmed);
  try {
    // `canOpenURL` can report false for valid web URLs on Android 11+ when the
    // resolving browser/app is not visible to the package. Let the OS resolve
    // universal HTTP(S) links directly and handle a genuine failure below.
    await Linking.openURL(url);
  } catch {
    Alert.alert('تعذر فتح الرابط', 'يرجى المحاولة لاحقًا أو التأكد من وجود متصفح محدث على جهازك.');
  }
}
