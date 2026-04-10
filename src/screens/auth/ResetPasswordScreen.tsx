import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  AppState,
  AppStateStatus,
  Modal,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  getOtpDeliveryActionLabel,
  getOtpDeliverySuccessMessage,
  mapAuthError,
  OtpDeliveryMethod,
  OTP_DELIVERY_OPTIONS,
} from '../../auth/otp';
import { authColors, authStyles } from '../../auth/ui';
import { api } from '../../services/api';
import { buildE164, digitsOnly, stripLeadingZero } from '../../util/phone';
import FlagIcon from '../../util/FlagIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BOT_USERNAME = 'TanamiTrain_bot';

const ARAB_COUNTRIES = [
  { nameAr: 'السعودية', iso: 'SA', dial: '966' },
  { nameAr: 'الإمارات', iso: 'AE', dial: '971' },
  { nameAr: 'قطر', iso: 'QA', dial: '974' },
  { nameAr: 'الكويت', iso: 'KW', dial: '965' },
  { nameAr: 'البحرين', iso: 'BH', dial: '973' },
  { nameAr: 'عُمان', iso: 'OM', dial: '968' },
  { nameAr: 'الأردن', iso: 'JO', dial: '962' },
  { nameAr: 'لبنان', iso: 'LB', dial: '961' },
  { nameAr: 'سوريا', iso: 'SY', dial: '963' },
  { nameAr: 'العراق', iso: 'IQ', dial: '964' },
  { nameAr: 'مصر', iso: 'EG', dial: '20' },
  { nameAr: 'اليمن', iso: 'YE', dial: '967' },
  { nameAr: 'فلسطين', iso: 'PS', dial: '970' },
  { nameAr: 'السودان', iso: 'SD', dial: '249' },
  { nameAr: 'الجزائر', iso: 'DZ', dial: '213' },
  { nameAr: 'المغرب', iso: 'MA', dial: '212' },
  { nameAr: 'تونس', iso: 'TN', dial: '216' },
  { nameAr: 'ليبيا', iso: 'LY', dial: '218' },
  { nameAr: 'موريتانيا', iso: 'MR', dial: '222' },
  { nameAr: 'الصومال', iso: 'SO', dial: '252' },
  { nameAr: 'جيبوتي', iso: 'DJ', dial: '253' },
  { nameAr: 'جزر القمر', iso: 'KM', dial: '269' },
];

async function openTelegramDeepLink(username: string, payload: string) {
  const tgUrl = `tg://resolve?domain=${username}&start=${encodeURIComponent(payload)}`;
  const httpUrl = `https://t.me/${username}?start=${encodeURIComponent(payload)}`;
  try {
    const supported = await Linking.canOpenURL(tgUrl);
    if (supported) return Linking.openURL(tgUrl);
    return Linking.openURL(httpUrl);
  } catch {
    Alert.alert('تعذر فتح تيليجرام', `افتح هذا الرابط يدوياً:\n${httpUrl}`);
  }
}

const ResetPasswordScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState(() => ARAB_COUNTRIES.find(c => c.iso === 'SY') || ARAB_COUNTRIES[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobileLocal, setMobileLocal] = useState('');
  const [checking, setChecking] = useState(false);
  const [linked, setLinked] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<OtpDeliveryMethod>('telegram');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pollSecondsLeft, setPollSecondsLeft] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const fullMobile = useMemo(
    () => buildE164(country.dial, mobileLocal),
    [country, mobileLocal]
  );

  const clearAllTimers = useCallback(() => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
    if (secondTimerRef.current) { clearInterval(secondTimerRef.current); secondTimerRef.current = null; }
    setPolling(false);
    setPollSecondsLeft(0);
  }, []);

  const checkStatusOnce = useCallback(async (_mobile?: string) => {
    const m = (_mobile ?? fullMobile).trim();
    if (!m) return null;
    if (deliveryMethod === 'sms') {
      setLinked(true);
      return true;
    }
    try {
      const status = await api.telegramStatus(m);
      setLinked(status.linked);
      return status.linked;
    } catch (e: any) {
      console.warn('[Reset] telegram-status error:', e?.message);
      setLinked(null);
      return null;
    }
  }, [deliveryMethod, fullMobile]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const startPollingStatus = useCallback(async (totalSeconds = 60, everyMs = 3000) => {
    if (deliveryMethod === 'sms') return;

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
  }, [checkStatusOnce, clearAllTimers, deliveryMethod]);

  useEffect(() => {
    if (deliveryMethod === 'sms') {
      setChecking(false);
      setLinked(true);
      clearAllTimers();
      return;
    }

    if (!fullMobile.trim()) {
      setLinked(null);
      setChecking(false);
      return;
    }

    setChecking(true);
    checkStatusOnce().finally(() => setChecking(false));
  }, [checkStatusOnce, clearAllTimers, deliveryMethod, fullMobile]);

  useEffect(() => {
    if (deliveryMethod === 'sms') return;

    const sub = AppState.addEventListener('change', async (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active' && fullMobile.trim()) {
        const ok = await checkStatusOnce();
        if (!ok) startPollingStatus(30, 3000);
      }
    });
    return () => sub.remove();
  }, [checkStatusOnce, deliveryMethod, fullMobile, startPollingStatus]);

  const onLinkTelegram = async () => {
    if (!digitsOnly(mobileLocal)) return Alert.alert('تنبيه', 'يرجى إدخال رقم الجوال');
    try {
      const { payload, code: shortCode } = await api.telegramCreateLink(fullMobile);
      await openTelegramDeepLink(BOT_USERNAME, payload);
      Alert.alert(
        'معلومة',
        `بعد الضغط على "ابدأ" داخل تيليجرام سنحاول ربط الحساب تلقائياً.${shortCode ? `\nإذا كانت المحادثة مفتوحة مسبقاً، أرسل هذا الرمز هناك: ${shortCode}` : ''}`
      );
      startPollingStatus(60, 3000);
    } catch (e: any) {
      Alert.alert('خطأ', mapAuthError(e?.response?.data?.error || e?.message));
    }
  };

  const onSendOtp = async () => {
    if (!digitsOnly(mobileLocal)) return Alert.alert('تنبيه', 'يرجى إدخال رقم الجوال');

    if (deliveryMethod === 'telegram') {
      setChecking(true);
      const isLinked = await checkStatusOnce(fullMobile);
      setChecking(false);

      if (!isLinked) {
        Alert.alert('تنبيه', 'الحساب غير مرتبط بتيليجرام. أكمل الربط أولاً.');
        return;
      }
    }

    setSending(true);
    try {
      await api.sendOtp(fullMobile, 'password_reset', deliveryMethod);
      Alert.alert('تم', getOtpDeliverySuccessMessage(deliveryMethod, 'reset'));
      setStep('verify');
    } catch (e: any) {
      Alert.alert('خطأ', mapAuthError(e?.response?.data?.error || e?.message));
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
    if (p.length < 6) return Alert.alert('تنبيه', 'كلمة المرور يجب ألا تقل عن 6 أحرف.');

    setVerifying(true);
    try {
      await api.passwordResetVerify(fullMobile, c, p);
      Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطأ', mapAuthError(e?.response?.data?.error || e?.message));
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
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
        <FlagIcon iso={item.iso} size={18} />
        <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, marginRight: 8 }}>
          {item.nameAr}
        </Text>
      </View>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: authColors.primary }}>+{item.dial}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={authStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[authStyles.scrollContent, { paddingBottom: 72 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={authStyles.hero}>
          <View style={authStyles.pill}>
            <Text style={authStyles.pillText}>استعادة كلمة المرور</Text>
          </View>
          <Text style={authStyles.title}>
            {step === 'request' ? 'اطلب رمز الاستعادة' : 'أدخل الرمز وكلمة المرور الجديدة'}
          </Text>
          <Text style={authStyles.subtitle}>
            استخدم رقم الجوال المسجل لديك ثم اختر الطريقة المناسبة لاستلام رمز التحقق.
          </Text>
        </View>

        <View style={authStyles.card}>
          {step === 'request' && (
            <>
              <Text style={authStyles.sectionTitle}>رقم الجوال</Text>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setPickerOpen(true)}
                  style={{
                    backgroundColor: authColors.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: authColors.cardBorder,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    minWidth: 120,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row-reverse',
                  }}
                >
                  <FlagIcon iso={country.iso} size={18} />
                  <Text style={{ fontFamily: 'NotoKufiArabic-Bold', color: authColors.primary, marginRight: 8 }}>
                    +{country.dial}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  placeholder="رقم الجوال بدون مفتاح الدولة"
                  keyboardType="phone-pad"
                  value={mobileLocal}
                  onChangeText={(t) => setMobileLocal(stripLeadingZero(digitsOnly(t)))}
                  style={[authStyles.field, { flex: 1 }]}
                />
              </View>

              <Text style={authStyles.sectionTitle}>طريقة استلام الرمز</Text>
              <View style={{ gap: 8 }}>
                {OTP_DELIVERY_OPTIONS.map(option => {
                  const selected = deliveryMethod === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setDeliveryMethod(option.key)}
                      style={[
                        authStyles.optionCard,
                        {
                          backgroundColor: selected ? authColors.primarySoft : authColors.surface,
                          borderColor: selected ? authColors.primary : authColors.cardBorder,
                        },
                      ]}
                    >
                      <Text style={authStyles.optionTitle}>{option.title}</Text>
                      <Text style={authStyles.optionDescription}>{option.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={onSendOtp}
                disabled={sending}
                style={authStyles.primaryButton}
              >
                {sending ? (
                  <ActivityIndicator color={authColors.white} />
                ) : (
                  <Text style={authStyles.primaryButtonText}>
                    {getOtpDeliveryActionLabel(deliveryMethod, 'reset')}
                  </Text>
                )}
              </TouchableOpacity>

              {deliveryMethod === 'sms' ? (
                <Text style={authStyles.centerText}>
                  سيصلك رمز الاستعادة عبر رسالة نصية على الرقم المسجل.
                </Text>
              ) : checking ? (
                <Text style={authStyles.centerText}>جاري التحقق من حالة تيليجرام...</Text>
              ) : linked ? (
                <Text style={authStyles.centerText}>
                  هذا الرقم مرتبط بتيليجرام ويمكنك طلب الرمز الآن.
                </Text>
              ) : (
                <Text style={authStyles.centerText}>
                  لطلب الرمز عبر تيليجرام، أكمل ربط الحساب أولاً.
                </Text>
              )}

              {deliveryMethod === 'telegram' && polling && (
                <View style={{ alignItems: 'center', marginBottom: 4 }}>
                  <ActivityIndicator />
                  <Text style={[authStyles.centerText, { marginTop: 6 }]}>
                    بانتظار ربط تيليجرام... ({pollSecondsLeft}s)
                  </Text>
                </View>
              )}

              {deliveryMethod === 'telegram' && !linked && (
                <>
                  <TouchableOpacity onPress={onLinkTelegram} style={authStyles.actionLink}>
                    <Text style={authStyles.actionLinkText}>ربط تيليجرام</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={onRefreshStatus} style={authStyles.actionLink}>
                    <Text style={authStyles.subtleLinkText}>تحديث الحالة</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {step === 'verify' && (
            <>
              <Text style={authStyles.centerText}>
                {deliveryMethod === 'sms'
                  ? 'أدخل رمز التحقق الذي وصلك عبر رسالة نصية.'
                  : 'أدخل رمز التحقق الذي وصلك عبر تيليجرام.'}
              </Text>
              <TextInput
                placeholder="رمز التحقق - 6 أرقام"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                style={[
                  authStyles.field,
                  { textAlign: 'center', letterSpacing: 4, writingDirection: 'ltr' },
                ]}
              />
              <TextInput
                placeholder="كلمة المرور الجديدة"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                style={authStyles.field}
              />
              <TouchableOpacity
                onPress={onVerifyReset}
                disabled={verifying}
                style={authStyles.primaryButton}
              >
                {verifying ? (
                  <ActivityIndicator color={authColors.white} />
                ) : (
                  <Text style={authStyles.primaryButtonText}>تأكيد تغيير كلمة المرور</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('request')} style={authStyles.actionLink}>
                <Text style={authStyles.subtleLinkText}>رجوع</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setPickerOpen(false)}>
            <View style={{ marginTop: 'auto', backgroundColor: authColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
              <View style={{ padding: 14, borderBottomWidth: 1, borderColor: '#eee' }}>
                <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, textAlign: 'center' }}>اختر مفتاح الدولة</Text>
              </View>
              <FlatList
                data={ARAB_COUNTRIES}
                keyExtractor={(it) => it.iso}
                renderItem={renderCountryRow}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f0f0f0' }} />}
                contentContainerStyle={{ paddingHorizontal: 6, paddingVertical: 8 }}
              />
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPasswordScreen;
