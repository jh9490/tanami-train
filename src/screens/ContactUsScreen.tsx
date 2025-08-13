import React from 'react';
import { View, Text, Linking } from 'react-native';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #fff;
`;

const ContactUsScreen = () => {
  return (
    <Container>
      <Text style={{ fontSize: 20, fontFamily: 'NotoKufiArabic-Bold', marginBottom: 10 }}>
        اتصل بنا
      </Text>
      <Text style={{ fontFamily: 'NotoKufiArabic-Regular', marginVertical: 5 }}>
        الهاتف: 0999222333
      </Text>
      <Text
        style={{ fontFamily: 'NotoKufiArabic-Regular', marginVertical: 5, color: 'blue' }}
        onPress={() => Linking.openURL('mailto:info@example.com')}
      >
        البريد الإلكتروني: info@example.com
      </Text>
    </Container>
  );
};

export default ContactUsScreen;
