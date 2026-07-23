import React from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components/native';
import { colors, gradients } from '../../theme/colors';

type Props = {
  children: ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

const Container = styled(LinearGradient)<{ padded?: boolean }>`
  flex: 1;
  background-color: ${colors.greenDark};
  padding: ${({ padded }) => (padded ? '16px' : '0px')};
`;

const AmbientCircle = styled(Animatable.View)<{
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}>`
  position: absolute;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: ${({ size }) => size / 2}px;
  background-color: rgba(203, 174, 130, 0.1);
  ${({ top }) => (top !== undefined ? `top: ${top}px;` : '')}
  ${({ bottom }) => (bottom !== undefined ? `bottom: ${bottom}px;` : '')}
  ${({ left }) => (left !== undefined ? `left: ${left}px;` : '')}
  ${({ right }) => (right !== undefined ? `right: ${right}px;` : '')}
`;

export default function ThemedBackground({ children, padded, style }: Props) {
  return (
    <Container colors={gradients.splash} padded={padded} style={style}>
      <AmbientCircle size={220} top={-72} right={-58} animation="pulse" iterationCount="infinite" duration={2800} />
      <AmbientCircle size={160} bottom={92} left={-70} animation="pulse" iterationCount="infinite" duration={3200} />
      {children}
    </Container>
  );
}
