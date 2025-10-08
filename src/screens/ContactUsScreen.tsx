import React from 'react';
import { View, Text, Linking } from 'react-native';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #eceadf;
`;

const ContactUsScreen = () => {
  return (
    <Container>
      <Text style={{ fontSize: 20, fontFamily: 'NotoKufiArabic-Bold', marginBottom: 10 , color : "#0f4f30" }}>
        اتصل بنا
      </Text>
      <Text style={{ fontFamily: 'NotoKufiArabic-Regular', marginVertical: 5  , color : "#0f4f30"}}>
        الهاتف: 963992293006+
      </Text>
      <Text
        style={{ fontFamily: 'NotoKufiArabic-Regular', marginVertical: 5,  color : "#0f4f30" }}
        onPress={() => Linking.openURL('mailto:info@tanamitrain.com')}
      >
        البريد الإلكتروني: info@tanamitrain.com
      </Text>
    </Container>
  );
};

export default ContactUsScreen;
