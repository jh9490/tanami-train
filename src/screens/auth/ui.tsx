// auth/ui.tsx
import React from 'react';
import styled from 'styled-components/native';

export const Screen = styled.View`
  flex: 1;
  background-color: #fff1e2;
  padding: 16px 12px;
`;

export const Field = styled.TextInput.attrs({
  placeholderTextColor: '#9ca3af',
})`
  background-color: #eceadf;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
  font-family: 'NotoKufiArabic-Regular';
  color: #111827;
`;

export const PrimaryBtn = styled.TouchableOpacity`
  background-color: #0f4f30;
  padding: 12px;
  border-radius: 10px;
  align-items: center;
  margin-top: 6px;
`;
export const PrimaryText = styled.Text`
  color: #eceadf;
  font-size: 14px;
  font-family: 'NotoKufiArabic-Bold';
`;

export const LinkText = styled.Text`
  color: #0f4f30;
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
  color: #6b7280;
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
