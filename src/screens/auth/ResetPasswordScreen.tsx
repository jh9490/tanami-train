// src/screens/auth/ResetPasswordScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Linking,
  AppState, AppStateStatus, Modal, FlatList, Pressable, I18nManager,
} from 'react-native';
import { api } from '../../services/api';
import { buildE164, digitsOnly, stripLeadingZero } from '../../util/phone';
import FlagIcon from '../../util/FlagIcon'; // ✅ use image flags instead of emoji

const BOT_USERNAME = 'TanamiTrain_bot'; // ← keep consistent with SignUp

// Arabic countries (dial as string) — flag field no longer used
const ARAB_COUNTRIES = [
  { nameAr: 'السعودية',  iso: 'SA', dial: '966' },
  { nameAr: 'الإمارات',   iso: 'AE', dial: '971' },
  { nameAr: 'قطر',       iso: 'QA', dial: '974' },
  { nameAr: 'الكويت',    iso: 'KW', dial: '965' },
  { nameAr: 'البحرين',   iso: 'BH', dial: '973' },
  { nameAr: 'عُمان',     iso: 'OM', dial: '968' },
  { nameAr: 'الأردن',    iso: 'JO', dial: '962' },
  { nameAr: 'لبنان',     iso: 'LB', dial: '961' },
  { nameAr: 'سوريا',     iso: 'SY', dial: '963' },
  { nameAr: 'العراق',    iso: 'IQ', dial: '964' },
  { nameAr: 'مصر',       iso: 'EG', dial: '20'  },
  { nameAr: 'اليمن',     iso: 'YE', dial: '967' },
  { nameAr: 'فلسطين',    iso: 'PS', dial: '970' },
  { nameAr: 'السودان',   iso: 'SD', dial: '249' },
  { nameAr: 'الجزائر',   iso: 'DZ', dial: '213' },
  { nameAr: 'المغرب',    iso: 'MA', dial: '212' },
  { nameAr: 'تونس',      iso: 'TN', dial: '216' },
  { nameAr: 'ليبيا',     iso: 'LY', dial: '218' },
  { nameAr: 'موريتانيا', iso: 'MR', dial: '222' },
  { nameAr: 'الصومال',   iso: 'SO', dial: '252' },
  { nameAr: 'جيبوتي',    iso: 'DJ', dial: '253' },
  { nameAr: 'جزر القمر', iso: 'KM', dial: '269' },
];

// Prefer tg:// then fallback to https://
async function openTelegramDeepLink(username: string, payload: string) {
  const tgUrl   = `tg://resolve?domain=${username}&start=${encodeURIComponent(payload)}`;
  const httpUrl = `https://t.me/${username}?start=${encodeURIComponent(payload)}`;
  try {
    const supported = await Linking.canOpenURL(tgUrl);
    if (supported) return Linking.openURL(tgUrl);
    return Linking.openURL(httpUrl);
  } catch {
    Alert.alert('تعذر فتح تيليجرام', `افتح هذا الرابط يدويًا:\n${httpUrl}`);
  }
}

const ResetPasswordScreen: React.FC<any> = ({ navigation }) => {
  // Country picker state (default SY)
  const [country, setCountry] = useState(() => ARAB_COUNTRIES.find(c => c.iso === 'SY') || ARAB_COUNTRIES[0]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Step A state (national number only here)
  const [mobileLocal, setMobileLocal] = useState('');
  const [checking, setChecking] = useState(false);
  const [linked, setLinked] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);

  // Step B state
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Polling helpers
  const [polling, setPolling] = useState(false);
  const [pollSecondsLeft, setPollSecondsLeft] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const secondTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef     = useRef<AppStateStatus>(AppState.currentState);

  // Build full E.164 mobile (drops a single leading 0 in national number)
  const fullMobile = useMemo(
    () => buildE164(country.dial, mobileLocal),
    [country, mobileLocal]
  );

  const clearAllTimers = useCallback(() => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (pollTimeoutRef.current)  { clearTimeout(pollTimeoutRef.current);   pollTimeoutRef.current  = null; }
    if (secondTimerRef.current)  { clearInterval(secondTimerRef.current);  secondTimerRef.current  = null; }
    setPolling(false);
    setPollSecondsLeft(0);
  }, []);

  const checkStatusOnce = useCallback(async (_mobile?: string) => {
    const m = (_mobile ?? fullMobile).trim();
    if (!m) return null;
    try {
      const { linked } = await api.telegramStatus(m);
      setLinked(linked);
      return linked;
    } catch (e: any) {
      console.warn('[Reset] telegram-status error:', e?.message);
      setLinked(null);
      return null;
    }
  }, [fullMobile]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  // refresh on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        if (fullMobile.trim()) {
          const ok = await checkStatusOnce();
          if (!ok) startPollingStatus(30, 3000);
        }
      }
    });
    return () => sub.remove();
  }, [fullMobile, checkStatusOnce]);

  const startPollingStatus = useCallback(async (totalSeconds = 60, everyMs = 3000) => {
    clearAllTimers();
    setPolling(true);
    setPollSecondsLeft(totalSeconds);

    secondTimerRef.current = setInterval(() => {
      setPollSecondsLeft(s => (s > 0 ? s - 1 : 0));
    }, 1000);

    const first = await checkStatusOnce();
    if (first) {
      clearAllTimers();
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      const ok = await checkStatusOnce();
      if (ok) clearAllTimers();
    }, everyMs);

    pollTimeoutRef.current = setTimeout(() => {
      clearAllTimers();
    }, totalSeconds * 1000);
  }, [checkStatusOnce, clearAllTimers]);

  const onLinkTelegram = async () => {
    if (!digitsOnly(mobileLocal)) return Alert.alert('تنبيه', 'يرجى إدخال رقم الجوال');
    try {
      const { payload, code: shortCode } = await api.telegramCreateLink(fullMobile);
      await openTelegramDeepLink(BOT_USERNAME, payload);
      Alert.alert(
        'معلومة',
        `بعد الضغط على "ابدأ" داخل تيليجرام سنحاول ربط الحساب تلقائيًا.${
          shortCode ? `\nإذا كانت المحادثة مفتوحة مسبقًا، أرسل هذا الرمز هناك: ${shortCode}` : ''
        }`
      );
      startPollingStatus(60, 3000);
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.error || e?.message || 'تعذر إنشاء رابط الربط');
    }
  };

  const onSendOtp = async () => {
    if (!digitsOnly(mobileLocal)) return Alert.alert('تنبيه', 'يرجى إدخال رقم الجوال');
    setChecking(true);
    const isLinked = await checkStatusOnce(fullMobile);
    setChecking(false);

    if (!isLinked) {
      Alert.alert('تنبيه', 'الحساب غير مرتبط بتيليجرام. قم بالربط أولاً.');
      return;
    }

    setSending(true);
    try {
      await api.sendOtp(fullMobile, 'password_reset');
      Alert.alert('تم', 'تم إرسال رمز استعادة كلمة المرور عبر تيليجرام.');
      setStep('verify');
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.error || e?.message || 'تعذر إرسال الرمز');
    } finally {
      setSending(false);
    }
  };

  const onVerifyReset = async () => {
    const c = code.trim();
    const p = newPassword;
    if (!digitsOnly(mobileLocal) || !c || !p) {
      return Alert.alert('تنبيه', 'أدخل الجوال والرمز وكلمة المرور الجديدة.');
    }
    if (c.length !== 6) return Alert.alert('تنبيه', 'رمز التحقق يجب أن يكون 6 أرقام.');
    if (p.length < 6)   return Alert.alert('تنبيه', 'كلمة المرور يجب أن لا تقل عن 6 أحرف.');

    setVerifying(true);
    try {
      await api.passwordResetVerify(fullMobile, c, p);
      Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.error || e?.message || 'رمز غير صحيح أو منتهي');
    } finally {
      setVerifying(false);
    }
  };

  const onRefreshStatus = async () => {
    setChecking(true);
    await checkStatusOnce();
    setChecking(false);
  };

  const renderCountryRow = ({ item }: { item: typeof ARAB_COUNTRIES[number] }) => (
    <Pressable
      onPress={() => { setCountry(item); setPickerOpen(false); }}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <FlagIcon iso={item.iso} size={18} />
        <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, marginLeft: 8 }}>
          {item.nameAr}
        </Text>
      </View>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: '#0f4f30' }}>+{item.dial}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 16 }}>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 18, textAlign: 'center', marginVertical: 12, color: '#0f4f30' }}>
        استعادة كلمة المرور
      </Text>

      {/* Step A: mobile + link/send */}
      {step === 'request' && (
        <>
          {/* Phone row (country + national) */}
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10 }}>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              style={{
                backgroundColor: '#eceadf',
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 12,
                minWidth: 120,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8,
                flexDirection: 'row',
              }}
            >
              <FlagIcon iso={country.iso} size={18} />
              <Text style={{ fontFamily: 'NotoKufiArabic-Bold', color: '#0f4f30', marginLeft: 8 }}>
                +{country.dial}
              </Text>
            </TouchableOpacity>

            <TextInput
              placeholder="رقم الجوال (بدون مفتاح)"
              keyboardType="phone-pad"
              value={mobileLocal}
              onChangeText={(t) => setMobileLocal(stripLeadingZero(digitsOnly(t)))}
              style={{
                flex: 1,
                backgroundColor: '#eceadf',
                borderRadius: 10,
                padding: 12,
                textAlign: 'right',
                color: '#0f4f30',
                fontWeight: 'bold',
              }}
            />
          </View>

           <TouchableOpacity
            onPress={onSendOtp}
            disabled={sending}
            style={{ backgroundColor: '#0f4f30', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 }}
          >
            {sending ? <ActivityIndicator color="#eceadf" /> : <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>إرسال الرمز عبر تيليجرام</Text>}
          </TouchableOpacity>

          {checking ? (
            <Text style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'NotoKufiArabic-Regular', color: '#0f4f30' }}>
              جاري التحقق من حالة تيليجرام...
            </Text>
          ) : linked ? (
            <Text style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'NotoKufiArabic-Regular', color: '#0f4f30' }}>
              هذا الرقم مرتبط بتيليجرام — يمكنك إرسال الرمز الآن.
            </Text>
          ) : (
            <Text style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'NotoKufiArabic-Regular', color: '#0f4f30' }}>
              لطلب الرمز عبر تيليجرام، اربط الحساب أولاً.
            </Text>
          )}

          {polling && (
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 6, color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular' }}>
                بانتظار ربط تيليجرام... ({pollSecondsLeft}s)
              </Text>
            </View>
          )}
        {!linked && (
   <TouchableOpacity onPress={onLinkTelegram} style={{ marginVertical: 6, alignItems: 'center' }}>
   <Text style={{ color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular' }}>ربط تيليجرام</Text>
 </TouchableOpacity>
        )}
       

         

          <TouchableOpacity onPress={onRefreshStatus} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular' }}>تحديث </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Step B: code + new password */}
      {step === 'verify' && (
        <>
          <Text style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'NotoKufiArabic-Regular', color: '#0f4f30' }}>
            أدخل رمز التحقق الذي وصلك عبر تيليجرام
          </Text>
          <TextInput
            placeholder="رمز التحقق (6 أرقام)"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'center', letterSpacing: 4 }}
          />
          <TextInput
            placeholder="كلمة المرور الجديدة"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'right', color:'#0f4f30', fontWeight: 'bold' }}
          />
          <TouchableOpacity
            onPress={onVerifyReset}
            disabled={verifying}
            style={{ backgroundColor: '#0f4f30', borderRadius: 10, padding: 14, alignItems: 'center' }}
          >
            {verifying ? <ActivityIndicator color="#eceadf" /> : <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>تأكيد تغيير كلمة المرور</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep('request')} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular' }}>رجوع</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Country picker modal */}
      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setPickerOpen(false)}>
          <View style={{ marginTop: 'auto', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' }}>
            <View style={{ padding: 14, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, textAlign: 'center' }}>اختر مفتاح الدولة</Text>
            </View>
            <FlatList
              data={ARAB_COUNTRIES}
              keyExtractor={(it) => it.iso}
              renderItem={renderCountryRow}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f0f0f0' }} />}
              contentContainerStyle={{ paddingHorizontal: 6, paddingVertical: 8 }}
              style={{ direction: I18nManager.isRTL ? 'rtl' as any : 'ltr' as any }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ResetPasswordScreen;
