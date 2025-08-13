import React from 'react';
import { View, Text, Linking, Button } from 'react-native';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #fff;
`;

const OurLocationScreen = () => {
  const handleOpenMap = () => {
    const url = 'https://maps.google.com/?q=25.2048,55.2708'; // Dubai as example
    Linking.openURL(url);
  };

  return (
    <Container>
      <Text style={{ fontSize: 20, fontFamily: 'NotoKufiArabic-Bold', marginBottom: 10 }}>
        موقعنا
      </Text>
      <Text style={{ fontFamily: 'NotoKufiArabic-Regular', marginVertical: 5 }}>
        الإمارات العربية المتحدة - دبي
      </Text>
      <Button title="افتح على الخريطة" onPress={handleOpenMap} color="#ffc546" />
    </Container>
  );
};

export default OurLocationScreen;
