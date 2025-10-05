import { Linking, Alert, Platform } from 'react-native';

const ensureHttp = (url: string) => {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

export async function openLinkSafe(rawUrl: string) {
  // Special handling for WhatsApp: prefer app -> fallback to web
  if (/whatsapp\.com\/channel/i.test(rawUrl)) {
    const waScheme = 'whatsapp://';
    try {
      const canOpenWA = await Linking.canOpenURL(waScheme);
      if (canOpenWA) {
        // Open WhatsApp app (e.g., the channel might still bounce to web, but app is preferred)
        await Linking.openURL(waScheme);
        return;
      }
    } catch {
      /* ignore and fallback */
    }
    // fallback to https link
  }

  const url = ensureHttp(rawUrl);
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('لا يمكن فتح الرابط', 'لا يوجد تطبيق مناسب لفتح هذا الرابط على جهازك.');
    }
  } catch (e) {
    Alert.alert('تعذر فتح الرابط', 'يرجى المحاولة لاحقًا أو التأكد من وجود متصفح محدث على جهازك.');
  }
}
