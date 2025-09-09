import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #eceadf;
`;

const Input = styled.TextInput`
  border: 1px solid #ccc;
  padding: 10px;
  margin-vertical: 10px;
  border-radius: 8px;
`;

const ButtonText = styled.Text`
  color: #eceadf;
  font-weight: bold;
`;

const VerifyCertificateScreen = () => {
  return (
    <Container>
      <Text style={{ fontSize: 20, fontFamily: 'NotoKufiArabic-Bold', marginBottom: 10 }}>
        التحقق من الشهادة
      </Text>
      <Input placeholder="أدخل رقم الشهادة" placeholderTextColor="#999" />
      <Button title="تحقق" onPress={() => alert('جارٍ التحقق...')} color="#ffc546" />
    </Container>
  );
};

export default VerifyCertificateScreen;
