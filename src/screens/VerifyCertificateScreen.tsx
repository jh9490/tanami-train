// src/screens/VerifyCertificateScreen.tsx
import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import CertificatePreview from './components/CertificatePreview';

const API_URL = 'http://tanamitrain.com/tanamiAdmin/api/mobile-app/check-certi';

const Container = styled.View`
  flex: 1;
  background-color: #fff1e2;
`;

const ScreenPad = styled.View`
  padding: 16px;
`;

const Title = styled.Text`
  font-size: 20px;
  font-family: NotoKufiArabic-Bold;
  color: #0f4f30;
  text-align: right;
  margin-bottom: 12px;
`;

const Hint = styled.Text`
  font-size: 10px;
  font-family: NotoKufiArabic-Bold;
  color: #0f4f30;
  text-align: center;
  margin-bottom: 12px;
  opacity: 0.75;
`;

const Input = styled.TextInput.attrs({
  placeholderTextColor: '#0f4f30',
})`
  background-color: #eceadf;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
  text-align: right;
  color: #0f4f30;
  font-weight: bold;
`;

const PrimaryButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  background-color: ${({ disabled }) => (disabled ? '#5a8f78' : '#0f4f30')};
  border-radius: 10px;
  padding: 14px;
  align-items: center;
  justify-content: center;
`;

const ButtonText = styled.Text`
  color: #eceadf;
  font-family: NotoKufiArabic-Bold;
  font-size: 16px;
`;

const Center = styled.View`
  align-items: center;
  justify-content: center;
  margin-top: 18px;
`;

const Badge = styled.View<{ color: string }>`
  background-color: ${({ color }) => color};
  border-radius: 60px;
  padding: 18px;
`;

const BadgeText = styled.Text`
  margin-top: 10px;
  font-family: NotoKufiArabic-Bold;
  color: #0f4f30;
  font-size: 18px;
`;

const Subtle = styled.Text`
  margin-top: 4px;
  color: #0f4f30;
  font-size: 14px;
  opacity: 0.8;
`;

type CertResponse = {
  result: 0 | 1;
  message?: string;
  lang?: string;
  authorizedGerm?: number | boolean;
  grade?: string | null;
  eval?: number;
  serial?: string;
  date?: string | null;
  student?: { id: number; name_ar: string; name_en: string };
  course?: { id: number; name_ar: string; name_en: string; hours: number };
};

const VerifyCertificateScreen: React.FC = () => {
  // DEBUG: detect double mounts quickly
  useEffect(() => {
    console.log('[VerifyCertificateScreen] mounted');
    return () => console.log('[VerifyCertificateScreen] unmounted');
  }, []);

  const [certId, setCertId] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<CertResponse | null>(null);

  const onVerify = async () => {
    const serial = certId.trim();
    if (!serial) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الشهادة.');
      return;
    }
    setBusy(true);
    setData(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial }),
      });

      let json: CertResponse;
      try {
        json = (await res.json()) as CertResponse;
      } catch {
        throw new Error('Invalid JSON response');
      }

      if (!res.ok) {
        const msg = json?.message || 'حدث خطأ في التحقق. حاول مرة أخرى.';
        throw new Error(msg);
      }

      setData(json);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مجددًا.');
    } finally {
      setBusy(false);
    }
  };

  const authorizedBool = (v: number | boolean | undefined) =>
    typeof v === 'boolean' ? v : Number(v) === 1;

  return (
    <Container>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}  // space over bottom tab
        >
          <ScreenPad>

            <Hint>أدخل رقم الشهادة للتحقق من صحتها</Hint>

            <Input
              placeholder="أدخل رقم الشهادة"
              value={certId}
              onChangeText={setCertId}
              returnKeyType="search"
              onSubmitEditing={onVerify}
            />

            <PrimaryButton onPress={onVerify} disabled={busy}>
              {busy ? <ActivityIndicator color="#eceadf" /> : <ButtonText>تحقق</ButtonText>}
            </PrimaryButton>

            {/* Result area (ONLY here; no other copy of the screen is rendered) */}
            {data && data.result === 0 && (
              <Animatable.View animation="shake" duration={700}>
                <Center>
                  <Badge color="#F44336">
                    <Icon name="times" size={48} color="#fff" />
                  </Badge>
                  <BadgeText>لم يتم العثور على الشهادة</BadgeText>
                  <Subtle>يرجى التأكد من الرقم والمحاولة مرة أخرى</Subtle>
                </Center>
              </Animatable.View>
            )}

            {data && data.result === 1 && (
              <>
                <Animatable.View animation="bounceIn" duration={700}>
                  <Center>
                    <Badge color="#4CAF50">
                      <Icon name="check" size={48} color="#fff" />
                    </Badge>
                    <BadgeText>تم التحقق من الشهادة</BadgeText>
                  </Center>
                </Animatable.View>

                <CertificatePreview
                  serial={data.serial ?? '-'}
                  nameAr={data.student?.name_ar ?? '-'}
                  nameEn={data.student?.name_en ?? undefined}
                  courseAr={data.course?.name_ar ?? '-'}
                  courseEn={data.course?.name_en ?? undefined}
                  hours={data.course?.hours ?? undefined}
                  date={data.date ?? undefined}
                  grade={data.grade ?? undefined}
                  authorized={authorizedBool(data.authorizedGerm)}
                  showShareButtons={true}
                />
              </>
            )}
          </ScreenPad>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default VerifyCertificateScreen;
