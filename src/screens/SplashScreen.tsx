import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');
const centerX = width / 2 - 10;  // Adjusted for 20px dot width
const centerY = height / 2 - 10; // Adjusted for dot height

const Container = styled(LinearGradient)`
  flex: 1;
`;

const Dot = styled(View)`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: #eceadf;
  position: absolute;
`;

const AppName = styled(Animatable.Text)`
  font-size: 28px;
  font-weight: bold;
  color: #eceadf;
  text-align: center;
  margin-top: 20px;
`;

const SplashScreen = () => {
  const dot1Ref = useRef<Animatable.View & View>(null);
  const dot2Ref = useRef<Animatable.View & View>(null);
  const dot3Ref = useRef<Animatable.View & View>(null);
  const logoRef = useRef<Animatable.View & View>(null);
  const appNameRef = useRef<Animatable.Text & View>(null);

  const [showDots, setShowDots] = useState(true);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const animateDots = async () => {
      await Promise.all([
        dot1Ref.current?.animate(
          {
            0: { top: -50, left: width * 0.2, opacity: 1 },
            1: { top: centerY, left: centerX, opacity: 0 },
          },
          1500
        ),
        dot2Ref.current?.animate(
          {
            0: { top: -80, left: width * 0.7, opacity: 1 },
            1: { top: centerY, left: centerX, opacity: 0 },
          },
          1500
        ),
        dot3Ref.current?.animate(
          {
            0: { top: -100, left: width * 0.45, opacity: 1 },
            1: { top: centerY, left: centerX, opacity: 0 },
          },
          1500
        ),
      ]);

      setShowDots(false);
      setShowLogo(true);

      await logoRef.current?.animate(
        {
          0: { scale: 0.5, opacity: 0 },
          0.6: { scale: 1, opacity: 1 },
          1: { scale: 1.2 },
        },
        2000
      );

      appNameRef.current?.fadeIn(1000);
    };

    animateDots();
  }, []);

  return (
    <Container colors={['#0f4f30', '#ffc546']}>
      {showDots && (
        <>
          <Animatable.View ref={dot1Ref}>
            <Dot />
          </Animatable.View>
          <Animatable.View ref={dot2Ref}>
            <Dot />
          </Animatable.View>
          <Animatable.View ref={dot3Ref}>
            <Dot />
          </Animatable.View>
        </>
      )}

      {showLogo && (
        <View
          style={{
            position: 'absolute',
            top: centerY - 100,
            left: width / 2 - 100,
            alignItems: 'center',
          }}
        >
          <Animatable.View ref={logoRef}>
            <Image
              source={require('../../logo1.png')}
              style={{ width: 200, height: 200, resizeMode: 'contain' }}
            />
          </Animatable.View>
   
        </View>
      )}
    </Container>
  );
};

export default SplashScreen;
