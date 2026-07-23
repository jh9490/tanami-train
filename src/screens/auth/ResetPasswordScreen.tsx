import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  getOtpDeliverySuccessMessage,
  mapAuthError,
} from '../../auth/otp';
import { authColors, authStyles } from '../../auth/ui';
import { api } from '../../services/api';
import { buildE164, digitsOnly, stripLeadingZero } from '../../util/phone';
import FlagIcon from '../../util/FlagIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedBackground from '../components/ThemedBackground';

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

const ResetPasswordScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState(() => ARAB_COUNTRIES.find(c => c.iso === 'SY') || ARAB_COUNTRIES[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobileLocal, setMobileLocal] = useState('');
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fullMobile = useMemo(
    () => buildE164(country.dial, mobileLocal),
    [country, mobileLocal]
  );

  const onSendOtp = async () => {
    if (!digitsOnly(mobileLocal)) return Alert.alert('تنبيه', 'يرجى إدخال رقم الجوال');

    setSending(true);
    try {
      await api.passwordResetRequest(fullMobile, 'whatsapp');
      Alert.alert('تم', getOtpDeliverySuccessMessage('whatsapp', 'reset'));
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
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: authColors.text }}>+{item.dial}</Text>
    </Pressable>
  );

  return (
    <ThemedBackground>
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
                  <Text style={{ fontFamily: 'NotoKufiArabic-Bold', color: authColors.text, marginRight: 8 }}>
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

              {/* <Text style={authStyles.sectionHint}>
                استخدم رقم الجوال وسيصلك الرمز عبر واتساب.
              </Text> */}

              <TouchableOpacity
                onPress={onSendOtp}
                disabled={sending}
                style={authStyles.primaryButton}
              >
                {sending ? (
                  <ActivityIndicator color={authColors.white} />
                ) : (
                  <Text style={authStyles.primaryButtonText}>إرسال الرمز عبر واتساب</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'verify' && (
            <>
              <Text style={authStyles.centerText}>
                أدخل رمز التحقق الذي وصلك عبر واتساب.
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
    </ThemedBackground>
  );
};

export default ResetPasswordScreen;
