import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { WebView } from 'react-native-webview';

const Container = styled.View`
  flex: 1;
  background-color: #fff;
`;

const Title = styled.Text`
  font-size: 20px;
  font-family: 'NotoKufiArabic-Bold';
  margin: 20px;
  text-align: center;
`;

const LocationText = styled.Text`
  font-size: 16px;
  font-family: 'NotoKufiArabic-Regular';
  text-align: center;
  color: #333;
  margin-bottom: 10px;
`;

const OurLocationScreen = () => {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLocation = async () => {
      try {
        const res = await fetch('http://tanamitrain.com/tanamiAdmin/api/mobile-app/location');
        const data = await res.json();
        if (data?.embed_url) {
          setEmbedUrl(data.embed_url);
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      } finally {
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  const iframeHtml = embedUrl
    ? `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>body, html { margin: 0; padding: 0; height: 100%; }</style>
      </head>
      <body>
        <iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" style="border:0;" allowfullscreen loading="lazy"></iframe>
      </body>
      </html>
    `
    : null;

  return (
    <Container>
      <LocationText>سوريا - اللاذقية - سوق التجار</LocationText>

      {loading ? (
        <ActivityIndicator size="large" color="#ffc546" style={{ marginTop: 16 }} />
      ) : iframeHtml ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: iframeHtml }}
          style={{ flex: 1 }}
        />
      ) : null}
    </Container>
  );
};

export default OurLocationScreen;
