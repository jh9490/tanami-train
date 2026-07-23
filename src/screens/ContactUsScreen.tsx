import React from 'react';
import { Text, Linking } from 'react-native';
import styled from 'styled-components/native';
import ThemedBackground from './components/ThemedBackground';
import { colors } from '../theme/colors';

const Container = styled(ThemedBackground)`
  flex: 1;
  padding: 20px;
`;

const ContactUsScreen = () => {
  return (
    <Container>
      <Text style={{ fontSize: 20, fontFamily: 'NotoKufiArabic-Bold', marginBottom: 10 , color : colors.cream }}>
        اتصل بنا
      </Text>
      <Text style={{ fontFamily: 'NotoKufiArabic-Regular', marginVertical: 5  , color : 'rgba(255, 248, 239, 0.82)'}}>
        الهاتف: 963992293006+
      </Text>
      <Text
        style={{ fontFamily: 'NotoKufiArabic-Regular', marginVertical: 5,  color : colors.gold }}
        onPress={() => Linking.openURL('mailto:info@tanamitrain.com')}
      >
        البريد الإلكتروني: info@tanamitrain.com
      </Text>
    </Container>
  );
};

export default ContactUsScreen;
