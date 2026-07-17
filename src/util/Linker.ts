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
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('لا يمكن فتح الرابط', 'لا يوجد تطبيق مناسب لفتح هذا الرابط على جهازك.');
      return;
    }

    await Linking.openURL(url);
  } catch (e) {
    Alert.alert('تعذر فتح الرابط', 'يرجى المحاولة لاحقًا أو التأكد من وجود متصفح محدث على جهازك.');
  }
}
