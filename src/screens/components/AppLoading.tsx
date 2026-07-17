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
  background-color: rgba(255, 248, 239, 0.9);
  z-index: 10;
`;

const LoaderCard = styled.View`
  min-width: 186px;
  align-items: center;
  justify-content: center;
  padding: 22px 24px;
  border-radius: 28px;
  background-color: rgba(255, 255, 255, 0.84);
  border-width: 1px;
  border-color: rgba(203, 174, 130, 0.22);
  shadow-color: #000;
  shadow-opacity: 0.07;
  shadow-radius: 14px;
  shadow-offset: 0px 6px;
  elevation: 4;
`;

const LogoHalo = styled(Animated.View)`
  width: 104px;
  height: 104px;
  border-radius: 52px;
  align-items: center;
  justify-content: center;
  background-color: rgba(232, 241, 234, 0.86);
`;

const LoadingLogo = styled.Image`
  width: 78px;
  height: 78px;
`;

const DotsRow = styled.View`
  flex-direction: row-reverse;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
`;

const LoadingDot = styled(Animated.View)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #cbae82;
  margin-horizontal: 4px;
`;

const LoadingText = styled.Text`
  margin-top: 12px;
  color: #0f4f30;
  font-family: 'NotoKufiArabic-Bold';
  font-size: 13px;
  line-height: 21px;
  text-align: center;
  writing-direction: rtl;
`;

const LoadingSubText = styled.Text`
  margin-top: 2px;
  color: #6b7280;
  font-family: 'NotoKufiArabic-Regular';
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  writing-direction: rtl;
`;

export default function AppLoading({ overlay = false, text, style }: AppLoadingProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const makeDotAnimation = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.35,
            duration: 360,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

    const dots = [makeDotAnimation(dot1, 0), makeDotAnimation(dot2, 160), makeDotAnimation(dot3, 320)];

    pulseAnimation.start();
    dots.forEach(animation => animation.start());

    return () => {
      pulseAnimation.stop();
      dots.forEach(animation => animation.stop());
    };
  }, [dot1, dot2, dot3, pulse]);

  const logoScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.06],
  });

  return (
    <Container overlay={overlay} pointerEvents={overlay ? 'auto' : 'none'} style={style}>
      <LoaderCard>
        <LogoHalo style={{ transform: [{ scale: logoScale }] }}>
          <LoadingLogo source={LOADING_LOGO} resizeMode="contain" />
        </LogoHalo>
        <DotsRow>
          <LoadingDot style={{ opacity: dot1, transform: [{ scale: dot1 }] }} />
          <LoadingDot style={{ opacity: dot2, transform: [{ scale: dot2 }] }} />
          <LoadingDot style={{ opacity: dot3, transform: [{ scale: dot3 }] }} />
        </DotsRow>
        <LoadingText>{text || 'يتم التحميل'}</LoadingText>
        <LoadingSubText>لحظات ونبدأ</LoadingSubText>
      </LoaderCard>
    </Container>
  );
}
