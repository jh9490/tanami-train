import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';
import styled from 'styled-components/native';

const LOADING_LOGO = require('../../assets/logo3.png');

type AppLoadingProps = {
  overlay?: boolean;
  text?: string;
  style?: ViewStyle;
};

const Container = styled.View<{ overlay?: boolean }>`
  ${({ overlay }) =>
    overlay
      ? `
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  `
      : `
    flex: 1;
  `}
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 241, 226, 0.82);
  z-index: 10;
`;

const LoadingLogo = styled.Image`
  width: 104px;
  height: 104px;
  margin-bottom: 18px;
`;

const LoadingBarTrack = styled.View`
  width: 44%;
  max-width: 180px;
  min-width: 128px;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background-color: rgba(15, 79, 48, 0.18);
`;

const LoadingBarFill = styled(Animated.View)`
  height: 100%;
  border-radius: 999px;
  background-color: #0f4f30;
`;

const LoadingText = styled.Text`
  margin-top: 12px;
  color: #0f4f30;
  font-family: 'NotoKufiArabic-Regular';
  font-size: 13px;
  text-align: center;
  writing-direction: rtl;
`;

export default function AppLoading({ overlay = false, text, style }: AppLoadingProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [progress]);

  return (
    <Container overlay={overlay} pointerEvents={overlay ? 'auto' : 'none'} style={style}>
      <LoadingLogo source={LOADING_LOGO} resizeMode="contain" />
      <LoadingBarTrack>
        <LoadingBarFill
          style={{
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['16%', '100%'],
            }),
          }}
        />
      </LoadingBarTrack>
      {text ? <LoadingText>{text}</LoadingText> : null}
    </Container>
  );
}
