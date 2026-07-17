import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import styled from 'styled-components/native';
import { WebView } from 'react-native-webview';
import AppLoading from './components/AppLoading';

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
  maps_app_url?: string;     // may be a dynamic link (avoid)
  latitude?: number;
  longitude?: number;
};

const sanitizeShortMapLink = (url?: string | null) => {
  if (!url) return null;
  if (url.includes('goo.gl/app/maps') || url.includes('maps.app.goo.gl')) return null; // reject
  return url;
};

export default function OurLocationScreen() {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [mapsUrl, setMapsUrl] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [useIframeWrapper, setUseIframeWrapper] = useState(true);

  const userAgent =
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Mobile Safari/537.36';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_URL);
        const data: LocationApi = await res.json();

        const lat_ = data?.latitude ?? null;
        const lng_ = data?.longitude ?? null;
        setLat(lat_); setLng(lng_);

        // 1) Build a stable embed URL
        let embed = data?.embed_url || null;
        if (!embed || !embed.includes('/maps/embed')) {
          if (lat_ != null && lng_ != null) {
            embed = `https://maps.google.com/maps?q=${lat_},${lng_}&output=embed`;
          } else {
            embed = null;
          }
        }

        // 2) External maps URL (avoid short dynamic links)
        const cleanedMaps = sanitizeShortMapLink(data?.maps_app_url);

        setEmbedUrl(embed);
        setMapsUrl(cleanedMaps);
        setFailed(!embed);   // if no safe embed we show buttons
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      if (lat != null && lng != null) {
        const label = encodeURIComponent('Tanami Train');
        const geoUrl =
          Platform.OS === 'android'
            ? `geo:${lat},${lng}?q=${lat},${lng}(${label})`
            : `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`;
        const canGeo = await Linking.canOpenURL(geoUrl);
        if (canGeo) return Linking.openURL(geoUrl);

        const httpsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        return Linking.openURL(httpsUrl);
      }

      // fallback to cleaned maps url if provided (non-dynamic)
      if (mapsUrl) {
        return Linking.openURL(mapsUrl);
      }
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
      // Prevent the Firebase dynamic link error; open a stable https instead
      if (lat != null && lng != null) {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => {});
      }
      return false;
    }

    return true;
  };

  const retry = () => { setUseIframeWrapper(v => !v); setFailed(false); };

  return (
    <Container>
      <LocationText>سوريا - اللاذقية - سوق التجار</LocationText>

      {loading ? (
        <AppLoading style={{ backgroundColor: 'transparent' }} />
      ) : embedUrl && !failed ? (
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
          renderLoading={() => <ActivityIndicator size="large" color="#ffc546" style={{ marginTop: 16 }} />}
          onHttpError={() => setFailed(true)}
          onError={() => setFailed(true)}
          onShouldStartLoadWithRequest={handleShouldStart}
          style={{ flex: 1 }}
        />
      ) : (
        <>
          <LocationText style={{ marginTop: 12, color: '#0f4f30' }}>
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
