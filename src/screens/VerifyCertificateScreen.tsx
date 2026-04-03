// src/screens/VerifyCertificateScreen.tsx
import React, { useCallback, useState, useRef } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  View,
  TouchableOpacity,
  Text,
  PermissionsAndroid,
} from 'react-native';
import styled from 'styled-components/native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Camera } from 'react-native-camera-kit';

// ↓↓↓ NEW: save/share libs
import ViewShot, { captureRef } from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

// Your preview component (Arabic/English via lang prop)
import CertificatePreviewNami from './components/CertificatePreviewNami';

const API_URL = 'http://tanamitrain.com/tanamiAdmin/api/mobile-app/check-certi';

/* ---------- styled ---------- */
const Container = styled.View`flex:1;background-color:#fff1e2;`;
const ScreenPad = styled.View`padding:16px;`;
const Hint = styled.Text`
  font-size: 10px;
  font-family: NotoKufiArabic-Bold;
  color: #0f4f30;
  text-align: center;
  margin-bottom: 12px;
  opacity: 0.75;
`;
const Input = styled.TextInput.attrs({ placeholderTextColor: '#0f4f30' })`
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
  margin-top: 8px;
`;
const ButtonText = styled.Text`color:#eceadf;font-family:NotoKufiArabic-Bold;font-size:16px;`;
const Center = styled.View`align-items:center;justify-content:center;margin-top:18px;`;
const Badge = styled.View<{ color: string }>`background-color:${({color})=>color};border-radius:60px;padding:18px;`;
const BadgeText = styled.Text`margin-top:10px;font-family:NotoKufiArabic-Bold;color:#0f4f30;font-size:18px;`;
const Subtle = styled.Text`margin-top:4px;color:#0f4f30;font-size:14px;opacity:.8;`;

/* ---------- types ---------- */
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

/* ---------- helpers ---------- */
function parseSerialFromQrPayload(payload: string): string | null {
  if (!payload) return null;
  const text = String(payload).trim();

  // If it's a URL, prefer ?serial=
  try {
    if (/^https?:\/\//i.test(text)) {
      const u = new URL(text);
      const q = u.searchParams.get('serial');
      if (q && /^[A-Za-z0-9_-]+$/.test(q)) return q;
      const mPath = u.pathname.match(/([A-Za-z0-9_-]{6,})/);
      if (mPath) return mPath[1];
    }
  } catch { /* not a URL */ }

  // labeled "serial: ..."
  const labeled = text.match(/serial[^A-Za-z0-9_-]*([A-Za-z0-9_-]{6,})/i);
  if (labeled) return labeled[1];

  // pure token
  const token = text.match(/^[A-Za-z0-9_-]{6,}$/);
  if (token) return token[0];

  // legacy digits
  const digits = text.replace(/\D+/g, '');
  if (digits.length >= 6) return digits;

  return null;
}

/** Capture a ViewShot ref and save to Photos */
async function saveCertificateAsImage(ref: React.RefObject<View>) {
  try {
    const uri = await captureRef(ref, { format: 'png', quality: 1 });
    await CameraRoll.save(uri, { type: 'photo', album: 'Certificates' });
    Alert.alert('تم الحفظ', 'تم حفظ الشهادة في الصور.');
  } catch (e: any) {
    console.warn('save error', e);
    Alert.alert('خطأ', 'تعذر حفظ الصورة. جرّب خيار المشاركة.');
  }
}

/** Capture a ViewShot ref and open the native share sheet */
async function shareCertificate(ref: React.RefObject<View>, filename = 'certificate.png') {
  try {
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'base64' });
    const path = `${RNFS.CachesDirectoryPath}/${filename}`;
    await RNFS.writeFile(path, uri, 'base64');
    await Share.open({ url: 'file://' + path, type: 'image/png' });
  } catch (e: any) {
    if (e?.message?.includes('User did not share')) return;
    console.warn('share error', e);
    Alert.alert('خطأ', 'تعذر مشاركة الصورة.');
  }
}

export default function VerifyCertificateScreen() {
  const [certId, setCertId] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<CertResponse | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [handlingScan, setHandlingScan] = useState(false);

  // Refs for view-shot (AR + EN)
  const arRef = useRef<View>(null);
  const enRef = useRef<View>(null);

  // Request camera permission for scanner
  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'إذن الكاميرا',
            message: 'هذا التطبيق يحتاج إلى إذن الكاميرا لمسح رمز QR.',
            buttonPositive: 'موافق',
            buttonNegative: 'إلغاء',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        Alert.alert('خطأ', 'تعذر طلب إذن الكاميرا.');
        return false;
      }
    }
    return true; // iOS shows its own prompt
  }, []);

  const openScanner = useCallback(async () => {
    const ok = await requestCameraPermission();
    if (ok) setScanOpen(true);
  }, [requestCameraPermission]);

  const onBarcodeRead = useCallback(
    (event: { nativeEvent: { codeStringValue: string } }) => {
      if (handlingScan) return;
      const value = event.nativeEvent.codeStringValue || '';
      const serial = parseSerialFromQrPayload(value);
      if (!serial) {
        Alert.alert('لم يتم التعرف', 'تعذر استخراج رقم الشهادة من الرمز. جرّب مرة أخرى أو أدخل الرقم يدويًا.');
        return;
      }
      setHandlingScan(true);
      setScanOpen(false);
      setCertId(serial);
      setTimeout(() => {
        onVerify(serial).finally(() => setHandlingScan(false));
      }, 100);
    },
    [handlingScan]
  );

  const onVerify = useCallback(async (serialOverride?: string) => {
    const serial = (serialOverride ?? certId).trim();
    if (!serial) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الشهادة.');
      return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(serial)) {
      Alert.alert('تنبيه', 'رقم الشهادة يجب أن يتكون من حروف أو أرقام فقط.');
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
  }, [certId]);

  return (
    <Container>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <ScreenPad>
            <Hint>أدخل رقم الشهادة للتحقق من صحتها، أو امسح رمز QR</Hint>

            <Input
              placeholder="أدخل رقم الشهادة"
              value={certId}
              onChangeText={setCertId}
              returnKeyType="search"
              onSubmitEditing={() => onVerify()}
            />

            <PrimaryButton onPress={() => onVerify()} disabled={busy}>
              {busy ? <ActivityIndicator color="#eceadf" /> : <ButtonText>تحقق</ButtonText>}
            </PrimaryButton>

            <PrimaryButton onPress={openScanner} disabled={busy} style={{ backgroundColor: '#145a43' }}>
              <ButtonText>مسح رمز QR</ButtonText>
            </PrimaryButton>

            {data && data.result === 0 && (
              <Animatable.View animation="shake" duration={700}>
                <Center>
                  <Badge color="#F44336">
                    <Icon name="times" size={48} color="#fff" />
                  </Badge>
                  <BadgeText>لم يتم العثور على الشهادة</BadgeText>
                  <Subtle>يرجى التأكد من الرقم أو إعادة المسح</Subtle>
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

                {/* AR card */}
                <ViewShot ref={arRef} style={{ borderRadius: 16, overflow: 'hidden', marginTop: 12 }}>
                  <CertificatePreviewNami
                    lang="ar"
                    name={data.student?.name_ar ?? '-'}
                    course={data.course?.name_ar ?? '-'}
                    hours={data.course?.hours ?? undefined}
                    grade={data.grade ?? undefined}
                    date={data.date ?? undefined}
                    serial={data.serial}
                    qrSource={{ uri: `https://tanamitrain.com/tanamiAdmin/api/certi/qr?serial=${encodeURIComponent(data.serial!)}&s=5&qz=2` }}
                  />
                </ViewShot>

                {/* AR actions */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10 }}>
                  <TouchableOpacity onPress={() => saveCertificateAsImage(arRef)} style={{ backgroundColor: '#0f4f30', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 }}>
                    <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>حفظ كصورة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => shareCertificate(arRef, 'certificate-ar.png')} style={{ backgroundColor: '#145a43', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 }}>
                    <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>مشاركة</Text>
                  </TouchableOpacity>
                </View>

                {/* space between AR/EN */}
                <View style={{ height: 24 }} />

                {/* EN card */}
                <ViewShot ref={enRef} style={{ borderRadius: 16, overflow: 'hidden' }}>
                  <CertificatePreviewNami
                    lang="en"
                    name={data.student?.name_en ?? '-'}
                    course={data.course?.name_en ?? '-'}
                    hours={data.course?.hours ?? undefined}
                    grade={data.grade ?? undefined}
                    date={data.date ?? undefined}
                    serial={data.serial}
                    qrSource={{ uri: `https://tanamitrain.com/tanamiAdmin/api/certi/qr?serial=${encodeURIComponent(data.serial!)}&s=5&qz=2` }}
                  />
                </ViewShot>

                {/* EN actions */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10 }}>
                  <TouchableOpacity onPress={() => saveCertificateAsImage(enRef)} style={{ backgroundColor: '#0f4f30', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 }}>
                    <Text style={{ color: '#eceadf' }}>Save Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => shareCertificate(enRef, 'certificate-en.png')} style={{ backgroundColor: '#145a43', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 }}>
                    <Text style={{ color: '#eceadf' }}>Share</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScreenPad>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* QR Scanner modal */}
      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ paddingTop: 40, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontFamily: 'NotoKufiArabic-Bold', fontSize: 16 }}>امسح رمز QR</Text>
            <TouchableOpacity onPress={() => setScanOpen(false)}>
              <Icon name="times" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Camera
            style={{ flex: 1 }}
            scanBarcode
            onReadCode={onBarcodeRead}
            showFrame
            laserColor="red"
            frameColor="white"
          />

          <View style={{ position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              وجّه الكاميرا نحو رمز الاستجابة السريعة على الشهادة
            </Text>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
