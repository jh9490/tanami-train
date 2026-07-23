// auth/ui.tsx
import styled from 'styled-components/native';
import { colors } from '../../theme/colors';
import ThemedBackground from '../components/ThemedBackground';

export const Screen = styled(ThemedBackground)`
  flex: 1;
  padding: 16px 12px;
`;

export const Field = styled.TextInput.attrs({
  placeholderTextColor: colors.hint,
})`
  background-color: ${colors.card};
  border: 1px solid ${colors.cardBorder};
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
  font-family: 'NotoKufiArabic-Regular';
  color: ${colors.text};
`;

export const PrimaryBtn = styled.TouchableOpacity`
  background-color: ${colors.green};
  padding: 12px;
  border-radius: 10px;
  align-items: center;
  margin-top: 6px;
`;
export const PrimaryText = styled.Text`
  color: ${colors.card};
  font-size: 14px;
  font-family: 'NotoKufiArabic-Bold';
`;

export const LinkText = styled.Text`
  color: ${colors.gold};
  font-size: 13px;
  font-family: 'NotoKufiArabic-Bold';
`;

export const RowBetween = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

export const Hint = styled.Text`
  color: rgba(255, 248, 239, 0.78);
  font-size: 12px;
  font-family: 'NotoKufiArabic-Regular';
  margin-bottom: 6px;
`;

export const ErrorMsg = styled.Text`
  color: #dc2626;
  font-size: 12px;
  margin-top: -6px;
  margin-bottom: 6px;
  font-family: 'NotoKufiArabic-Regular';
`;

/* Small utils */
export const onlyDigits = (s: string) => s.replace(/[^\d]/g, '');
export const normalizePhone = (raw: string) => {
  const d = onlyDigits(raw);
  // adjust to your rule; here we just return digits (max 15)
  return d.slice(0, 15);
};
