import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking } from 'react-native';
import styled from 'styled-components/native';
import { WebView } from 'react-native-webview';

const API_URL = 'http://tanamitrain.com/tanamiAdmin/api/mobile-app/location';

const Container = styled.View` flex: 1; background-color: #eceadf; `;
const LocationText = styled.Text`
  font-size: 16px; font-family: 'NotoKufiArabic-Regular';
  text-align: center; color: #333; margin: 10px 16px;
`;
const Row = styled.View` flex-direction: row; justify-content: center; gap: 10px; margin: 10px 16px; `;
const Btn = styled.TouchableOpacity` background: #ffc546; padding: 10px 14px; border-radius: 10px; `;
const BtnText = styled.Text` color: #000; font-family: 'NotoKufiArabic-Bold'; `;

type LocationApi = {
  embed_url?: string;
  maps_app_url?: string;
  latitude?: number;
  longitude?: number;
};

const OurLocationScreen = () => {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [mapsUrl, setMapsUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [useIframeWrapper, setUseIframeWrapper] = useState(true); // start with iframe wrapper (most reliable)

  // modern UA helps on some Samsung devices
  const userAgent =
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Mobile Safari/537.36';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_URL);
        const data: LocationApi = await res.json();

        // Normalize to ensure we have a proper *embed* URL
        let url = data?.embed_url || null;
        // If API returned a non-embed URL (like maps_app_url), don't use it in WebView.
        if (url && !url.includes('/maps/embed')) {
          // If lat/lng are present, we can construct a minimal embed as a fallback
          if (data?.latitude && data?.longitude) {
            const { latitude, longitude } = data;
            url = `https://maps.google.com/maps?q=${latitude},${longitude}&output=embed`;
          } else {
            // no safe embed; mark as failed so we show the external button
            url = null;
          }
        }

        setEmbedUrl(url);
        setMapsUrl(data?.maps_app_url ?? null);
        setFailed(!url);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // HTML wrapper for the embed (tends to be the most compatible)
  const iframeHtml = useMemo(() => {
    if (!embedUrl) return null;
    return `<!doctype html>
<html dir="rtl" lang="ar">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>html,body{height:100%;margin:0;padding:0;overflow:hidden}</style>
</head>
<body>
  <iframe src="${embedUrl}" style="border:0;width:100%;height:100%;" loading="lazy" allowfullscreen></iframe>
</body>
</html>`;
  }, [embedUrl]);

  const openExternal = async () => {
    const url = mapsUrl || embedUrl || '';
    if (!url) return;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert('تعذّر فتح الرابط', url);
    } catch {
      Alert.alert('تعذّر فتح الرابط');
    }
  };

  const retry = () => {
    // Toggle between html wrapper and direct uri to dodge OEM quirks
    setUseIframeWrapper((v) => !v);
    setFailed(false);
  };

  return (
    <Container>
      <LocationText>سوريا - اللاذقية - سوق التجار</LocationText>

      {loading ? (
        <ActivityIndicator size="large" color="#ffc546" style={{ marginTop: 16 }} />
      ) : embedUrl && !failed ? (
        <WebView
          source={useIframeWrapper ? { html: iframeHtml! } : { uri: embedUrl }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          androidLayerType="software"               // try "hardware" on some devices if needed
          userAgent={userAgent}
          setSupportMultipleWindows={false}
          javaScriptCanOpenWindowsAutomatically={false}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator size="large" color="#ffc546" style={{ marginTop: 16 }} />
          )}
          onHttpError={() => setFailed(true)}
          onError={() => setFailed(true)}
          onShouldStartLoadWithRequest={() => true}
          style={{ flex: 1 }}
        />
      ) : (
        <>
          <LocationText style={{ marginTop: 12 }}>
            تعذّر تحميل الخريطة داخل التطبيق.
          </LocationText>
          <Row>
            {mapsUrl ? (
              <Btn onPress={openExternal}><BtnText>فتح في خرائط Google</BtnText></Btn>
            ) : null}
            <Btn onPress={retry}><BtnText>إعادة المحاولة</BtnText></Btn>
          </Row>
        </>
      )}
    </Container>
  );
};

export default OurLocationScreen;
