// src/components/CertificatePreview.tsx
import React, { useRef } from 'react';
import {
  View,
  Platform,
  Alert,
  Dimensions,
  ScrollView,
  ImageSourcePropType,   // 👈 add
} from 'react-native';
import styled from 'styled-components/native';
import * as Animatable from 'react-native-animatable';
import ViewShot, { captureRef } from 'react-native-view-shot';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 👇 static require so Metro bundles the asset (adjust the path if needed)
const defaultLogo = require('../../../logo2.png');

const Outer = styled(Animatable.View)`
  background-color: #fdfaf5;
  border-radius: 16px;
  padding: 16px;
  margin-top: 16px;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`;

const Frame = styled.View`
  border-width: 2px;
  border-color: #0f4f30;
  border-radius: 12px;
  overflow: hidden;
`;

const ScrollArea = styled(ScrollView)`
  max-height: ${Math.round(SCREEN_HEIGHT * 0.65)}px;
  background-color: #fffdf7;
`;

const InnerFrame = styled.View`
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: #0f4f30;
  padding: 16px;
`;

const Header = styled.Text`
  font-family: NotoKufiArabic-Bold;
  color: #0f4f30;
  text-align: center;
  font-size: 20px;
`;

const SubHeader = styled.Text`
  font-family: NotoKufiArabic-Bold;
  color: #0f4f30;
  text-align: center;
  font-size: 14px;
  opacity: 0.8;
  margin-top: 4px;
`;

const Name = styled.Text`
  font-family: NotoKufiArabic-Bold;
  color: #0f4f30;
  text-align: center;
  font-size: 22px;
  margin-top: 16px;
`;

const Line = styled.View`
  height: 1px;
  background-color: #d3d0c7;
  margin-vertical: 12px;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-vertical: 6px;
`;

const Label = styled.Text`
  font-family: NotoKufiArabic-Bold;
  color: #0f4f30;
  font-size: 12px;
`;

const Value = styled.Text`
  color: #0f4f30;
  font-size: 12px;
  text-align: left;
`;

const FooterRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 18px;
`;

const Seal = styled.View`
  background-color: #0f4f30;
  padding: 10px 14px;
  border-radius: 999px;
`;

const SealText = styled.Text`
  color: #eceadf;
  font-family: NotoKufiArabic-Bold;
  font-size: 12px;
`;

const Actions = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
`;

const ActionBtn = styled.TouchableOpacity`
  background-color: #0f4f30;
  padding: 10px 16px;
  border-radius: 10px;
`;

const ActionText = styled.Text`
  color: #eceadf;
  font-family: NotoKufiArabic-Bold;
`;

// 👇 logo image
const LogoImage = styled.Image.attrs({ resizeMode: 'contain' })`
  width: 100px;
  height: 100px;
  align-self: center;
  margin: 12px 0 6px 0;
`;

type Props = {
  serial: string;
  nameAr: string;
  nameEn?: string | null;
  courseAr: string;
  courseEn?: string | null;
  hours?: number | null;
  date?: string | null;
  grade?: string | null;
  authorized?: boolean;
  showShareButtons?: boolean;
  verificationUrl?: string;
  logoSource?: ImageSourcePropType; // 👈 optional override
};

const CertificatePreview: React.FC<Props> = ({
  serial,
  nameAr,
  nameEn,
  courseAr,
  courseEn,
  hours,
  date,
  grade,
  authorized,
  showShareButtons = false,
  logoSource, // 👈
}) => {
  const cardRef = useRef<View>(null);

  const onSave = async () => {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      Alert.alert('تم الحفظ', Platform.select({ ios: uri, android: uri }) || 'Saved.');
    } catch (e) {
      Alert.alert('خطأ', 'تعذر حفظ الصورة.');
      console.warn('ViewShot error:', e);
    }
  };

  return (
    <Outer animation="fadeInUp" duration={600}>
      <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
        <Frame>
          <ScrollArea contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator>
            <Header>شهادة</Header>
            <SubHeader>صادرة عن Tanami Train</SubHeader>

            {/* 👇 the logo */}
            <LogoImage source={logoSource || defaultLogo} />

            <Name>{nameAr}</Name>
            {nameEn ? <SubHeader>{nameEn}</SubHeader> : null}

            <Line />

            <InnerFrame>
              <Row>
                <Label>الدورة التدريبية:</Label>
                <Value>{courseAr}</Value>
              </Row>
              {courseEn ? (
                <Row>
                  <Label>Course:</Label>
                  <Value>{courseEn}</Value>
                </Row>
              ) : null}

              <Row>
                <Label>عدد الساعات:</Label>
                <Value>{hours ?? '-'}</Value>
              </Row>

              <Row>
                <Label>التاريخ:</Label>
                <Value>{date ?? '-'}</Value>
              </Row>

              <Row>
                <Label>الرقم التسلسلي:</Label>
                <Value>{serial}</Value>
              </Row>
            </InnerFrame>
          </ScrollArea>
        </Frame>
      </ViewShot>

      {showShareButtons ? (
        <Actions>
          <ActionBtn onPress={onSave}>
            <ActionText>حفظ كصورة</ActionText>
          </ActionBtn>
        </Actions>
      ) : null}
    </Outer>
  );
};

export default CertificatePreview;
