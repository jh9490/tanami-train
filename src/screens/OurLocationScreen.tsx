import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import styled from 'styled-components/native';
import { WebView } from 'react-native-webview';
import ThemedBackground from './components/ThemedBackground';
import { colors } from '../theme/colors';
import { TANAMI_TRAIN_EMBED_URL, TANAMI_TRAIN_LOCATION } from '../constants/location';

const Container = styled(ThemedBackground)` flex: 1; `;
const LocationText = styled.Text`
  font-size: 16px; font-family: 'NotoKufiArabic-Regular';
  text-align: center; color: rgba(255, 248, 239, 0.82); margin: 10px 16px;
`;
const Row = styled.View` flex-direction: row; justify-content: center; gap: 10px; margin: 10px 16px; `;
const Btn = styled.TouchableOpacity` background: ${colors.gold}; padding: 10px 14px; border-radius: 10px; `;
const BtnText = styled.Text` color: ${colors.greenDarker}; font-family: 'NotoKufiArabic-Bold'; `;

export default function OurLocationScreen() {
  const [failed, setFailed] = useState(false);
  const [useIframeWrapper, setUseIframeWrapper] = useState(true);

  const { latitude: lat, longitude: lng, label, googleMapsUrl } = TANAMI_TRAIN_LOCATION;
  const embedUrl = TANAMI_TRAIN_EMBED_URL;

  const userAgent =
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Mobile Safari/537.36';

  // HTML wrapper is the most compatible inside WebView
  const iframeHtml = useMemo(() => {
    if (!embedUrl) return null;
    return `<!doctype html>
<html dir="rtl" lang="ar">
<head><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>html,body{height:100%;margin:0;overflow:hidden}</style></head>
<body><iframe src="${embedUrl}" style="border:0;width:100%;height:100%" loading="lazy" allowfullscreen></iframe></body>
</html>`;
  }, [embedUrl]);

  // Open externally with geo: if possible, else HTTPS fallback
  const openExternal = async () => {
    try {
      if (Platform.OS === 'android') {
        const encodedLabel = encodeURIComponent(label);
        const geoUrl = `geo:${lat},${lng}?q=${lat},${lng}(${encodedLabel})`;
        const canGeo = await Linking.canOpenURL(geoUrl);
        if (canGeo) return Linking.openURL(geoUrl);
      }

      return Linking.openURL(googleMapsUrl);
    } catch (e) {
      Alert.alert('تعذّر فتح الخريطة');
    }
  };

  // Handle intent:// and other special schemes inside WebView
  const handleShouldStart = (req: any) => {
    const url: string = req?.url || '';
    if (!url) return true;

    if (url.startsWith('intent://') || url.startsWith('market://') || url.startsWith('geo:')) {
      Linking.openURL(url).catch(() => {});
      return false;
    }

    if (url.includes('goo.gl/app/maps') || url.includes('maps.app.goo.gl')) {
      Linking.openURL(googleMapsUrl).catch(() => {});
      return false;
    }

    return true;
  };

  const retry = () => { setUseIframeWrapper(v => !v); setFailed(false); };

  return (
    <Container>
      <LocationText>سوريا - اللاذقية - سوق التجار</LocationText>

      {!failed ? (
        <WebView
          source={useIframeWrapper ? { html: iframeHtml! } : { uri: embedUrl }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          androidLayerType="software"
          userAgent={userAgent}
          setSupportMultipleWindows={false}
          javaScriptCanOpenWindowsAutomatically={false}
          startInLoadingState
          renderLoading={() => <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 16 }} />}
          onHttpError={() => setFailed(true)}
          onError={() => setFailed(true)}
          onShouldStartLoadWithRequest={handleShouldStart}
          style={{ flex: 1 }}
        />
      ) : (
        <>
          <LocationText style={{ marginTop: 12, color: colors.cream }}>
            تعذّر تحميل الخريطة داخل التطبيق.
          </LocationText>
          <Row>
            <Btn onPress={openExternal}><BtnText>فتح في خرائط Google</BtnText></Btn>
            <Btn onPress={retry}><BtnText>إعادة المحاولة</BtnText></Btn>
          </Row>
        </>
      )}
    </Container>
  );
}
