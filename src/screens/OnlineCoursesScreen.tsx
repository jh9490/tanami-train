import React from 'react';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ThemedBackground from './components/ThemedBackground';
import { colors } from '../theme/colors';

const Container = styled(ThemedBackground)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Message = styled.Text`
  margin-top: 14px;
  color: ${colors.cream};
  font-family: 'NotoKufiArabic-Bold';
  font-size: 18px;
  line-height: 30px;
  text-align: center;
`;

export default function OnlineCoursesScreen() {
  return (
    <Container>
      <Icon name="live-tv" size={48} color={colors.gold} />
      <Message>الحضور أونلاين سيكون متاحاً قريباً</Message>
    </Container>
  );
}
