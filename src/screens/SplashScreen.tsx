import React, { useEffect } from 'react';
import { Image } from 'react-native';
import * as Animatable from 'react-native-animatable';
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';

const LOGO = require('../../logo2.png');

type Props = { onDone?: () => void };

const Container = styled(LinearGradient)`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: #0c2a20;
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

const LogoHalo = styled(Animatable.View)`
  width: 214px;
  height: 214px;
  border-radius: 107px;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 248, 239, 0.1);
  border-width: 1px;
  border-color: rgba(203, 174, 130, 0.38);
`;

const LogoCard = styled(Animatable.View)`
  width: 172px;
  height: 172px;
  border-radius: 42px;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 248, 239, 0.96);
  shadow-color: #000;
  shadow-opacity: 0.18;
  shadow-radius: 18px;
  shadow-offset: 0px 8px;
  elevation: 8;
`;

const LogoImage = styled(Image)`
  width: 132px;
  height: 132px;
`;

const Tagline = styled(Animatable.Text)`
  margin-top: 24px;
  color: #fff8ef;
  font-family: 'NotoKufiArabic-Bold';
  font-size: 19px;
  line-height: 30px;
  text-align: center;
  writing-direction: rtl;
`;

const SubTagline = styled(Animatable.Text)`
  margin-top: 6px;
  color: rgba(255, 248, 239, 0.78);
  font-family: 'NotoKufiArabic-Regular';
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  writing-direction: rtl;
`;

const GoldPath = styled(Animatable.View)`
  width: 96px;
  height: 4px;
  border-radius: 999px;
  background-color: #cbae82;
  margin-top: 20px;
`;

const FeatureGrid = styled(Animatable.View)`
  width: 82%;
  max-width: 360px;
  margin-top: 28px;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  justify-content: center;
`;

const MiniCard = styled(Animatable.View)`
  width: 46%;
  min-height: 46px;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 248, 239, 0.12);
  border-width: 1px;
  border-color: rgba(255, 248, 239, 0.16);
  margin: 5px;
  padding-horizontal: 8px;
`;

const MiniCardText = styled.Text`
  color: rgba(255, 248, 239, 0.82);
  font-family: 'NotoKufiArabic-Bold';
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  writing-direction: rtl;
`;

const OnePlaceText = styled(Animatable.Text)`
  margin-top: 12px;
  color: #cbae82;
  font-family: 'NotoKufiArabic-Bold';
  font-size: 15px;
  line-height: 24px;
  text-align: center;
  writing-direction: rtl;
`;

export default function SplashScreen({ onDone }: Props) {
  useEffect(() => {
    const timeout = setTimeout(() => onDone?.(), 4300);
    return () => clearTimeout(timeout);
  }, [onDone]);

  return (
    <Container colors={['#061713', '#0c2a20', '#123d2b']}>
      <AmbientCircle size={220} top={-72} right={-58} animation="pulse" iterationCount="infinite" duration={2800} />
      <AmbientCircle size={160} bottom={92} left={-70} animation="pulse" iterationCount="infinite" duration={3200} />

      <LogoHalo animation="zoomIn" duration={850} easing="ease-out-cubic">
        <LogoCard animation="pulse" delay={650} duration={1600} iterationCount={2}>
          <LogoImage source={LOGO} resizeMode="contain" />
        </LogoCard>
      </LogoHalo>

      <Tagline animation="fadeInUp" delay={650} duration={850}>
        رحلتك للتعلّم تبدأ هنا
      </Tagline>
      <SubTagline animation="fadeInUp" delay={850} duration={850}>
        تعلّم. تطوّر. أنجز.
      </SubTagline>
      <GoldPath animation="fadeInLeft" delay={1050} duration={900} />

      <FeatureGrid>
        <MiniCard animation="fadeInUp" delay={1250} duration={520}>
          <MiniCardText>دوراتك</MiniCardText>
        </MiniCard>
        <MiniCard animation="fadeInUp" delay={1400} duration={520}>
          <MiniCardText>شهاداتك</MiniCardText>
        </MiniCard>
        <MiniCard animation="fadeInUp" delay={1550} duration={520}>
          <MiniCardText>سيزتك الذاتية</MiniCardText>
        </MiniCard>
        <MiniCard animation="fadeInUp" delay={1700} duration={520}>
          <MiniCardText>تحقق من شهادة</MiniCardText>
        </MiniCard>
        <MiniCard animation="fadeInUp" delay={1850} duration={520}>
          <MiniCardText>اكتشف اكثر</MiniCardText>
        </MiniCard>
        <MiniCard animation="fadeInUp" delay={2000} duration={520}>
          <MiniCardText>خليك عالسمع!</MiniCardText>
        </MiniCard>
      </FeatureGrid>
      <OnePlaceText animation="fadeInUp" delay={2300} duration={650}>
        كله بمكان واحد
      </OnePlaceText>
    </Container>
  );
}
