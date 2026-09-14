import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  canSubmitStart,
  secondsUntil,
} from '../../auth/onboardingReducer';
import {
  getOnboardingErrorMessage,
  getRetryCountdownMessage,
} from '../../auth/onboardingErrors';
import { authColors, authStyles } from '../../auth/ui';
import FlagIcon from '../../util/FlagIcon';
import { digitsOnly, stripLeadingZero } from '../../util/phone';
import ThemedBackground from '../components/ThemedBackground';
import { useOnboardingFlow } from './OnboardingFlowProvider';

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
] as const;

type Country = typeof ARAB_COUNTRIES[number];

export default function PhoneEntryScreen({ navigation }: any) {
  const { state, setPhoneInput, start, retryStart } = useOnboardingFlow();
  const [country, setCountry] = useState<Country>(() =>
    ARAB_COUNTRIES.find(item => item.dial === (state.countryCode || '963')) ??
    ARAB_COUNTRIES[8],
  );
  const [mobile, setMobile] = useState(state.mobile);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now());

  const attempt = state.startAttempt;
  const busy = attempt?.status === 'submitting';
  const retryable = attempt?.status === 'retryable';
  const retrySeconds = secondsUntil(attempt?.retryAt ?? null, clock);

  useEffect(() => {
    if (attempt?.status !== 'rate_limited' || retrySeconds === 0) return;
    const timer = setInterval(() => setClock(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [attempt?.status, retrySeconds]);

  const selectCountry = (nextCountry: Country) => {
    setCountry(nextCountry);
    setPhoneInput(nextCountry.dial, mobile);
    setPickerOpen(false);
    setLocalError(null);
  };

  const updateMobile = (value: string) => {
    const normalized = stripLeadingZero(digitsOnly(value)).slice(0, 18);
    setMobile(normalized);
    setPhoneInput(country.dial, normalized);
    setLocalError(null);
  };

  const submit = async () => {
    if (!country.dial || !/^\d+$/.test(mobile)) {
      setLocalError('أدخل مفتاح الدولة ورقم الجوال.');
      return;
    }
    const response = await start({ country_code: country.dial, mobile });
    if (response) navigation.replace('OtpVerification');
  };

  const retry = async () => {
    const response = await retryStart();
    if (response) navigation.replace('OtpVerification');
  };

  const errorMessage = localError || (state.error && getOnboardingErrorMessage(state.error));

  return (
    <ThemedBackground>
      <KeyboardAvoidingView
        style={authStyles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={authStyles.hero}>
            <View style={authStyles.pill}><Text style={authStyles.pillText}>إنشاء الحساب</Text></View>
            <Text style={authStyles.title}>ابدأ برقم جوالك</Text>
            <Text style={authStyles.subtitle}>
              سنرسل رمزًا للتحقق من الرقم قبل عرض أي معلومات مرتبطة بالحساب.
            </Text>
          </View>

          <View style={authStyles.card}>
            <Text style={authStyles.sectionTitle}>رقم الجوال</Text>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                testID="country-picker-button"
                accessibilityRole="button"
                accessibilityLabel={`مفتاح الدولة ${country.nameAr} +${country.dial} / Country code`}
                accessibilityHint="يفتح قائمة الدول"
                onPress={() => setPickerOpen(true)}
                style={styles.countryButton}
              >
                <FlagIcon iso={country.iso} size={18} />
                <Text style={styles.countryDial}>+{country.dial}</Text>
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>

              <TextInput
                testID="mobile-input"
                accessibilityLabel="رقم الجوال / Mobile number"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={updateMobile}
                placeholder="رقم الجوال بدون مفتاح الدولة"
                style={[authStyles.field, styles.mobileField, styles.numericField]}
              />
            </View>

            {errorMessage ? (
              <Text
                testID="onboarding-error"
                accessibilityLiveRegion="polite"
                style={[authStyles.centerText, styles.errorText]}
              >
                {errorMessage}
              </Text>
            ) : null}

            {attempt?.status === 'rate_limited' && retrySeconds > 0 ? (
              <Text accessibilityLiveRegion="polite" style={authStyles.centerText}>
                {getRetryCountdownMessage(retrySeconds)}
              </Text>
            ) : null}

            <TouchableOpacity
              testID={retryable ? 'retry-start-button' : 'start-button'}
              accessibilityRole="button"
              accessibilityLabel={retryable ? 'إعادة المحاولة / Retry' : 'إرسال رمز التحقق / Send code'}
              accessibilityState={{ disabled: busy || !canSubmitStart(state, clock), busy }}
              onPress={retryable ? retry : submit}
              disabled={busy || (!retryable && !canSubmitStart(state, clock))}
              style={[authStyles.primaryButton, busy && styles.busyButton]}
            >
              {busy ? <ActivityIndicator color={authColors.white} /> : (
                <Text style={authStyles.primaryButtonText}>
                  {retryable ? 'إعادة المحاولة' : 'إرسال رمز التحقق'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={pickerOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setPickerOpen(false)}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="إغلاق قائمة الدول / Close country list"
            style={styles.modalBackdrop}
            onPress={() => setPickerOpen(false)}
          >
            <View style={styles.countrySheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>اختر مفتاح الدولة</Text>
              </View>
              <FlatList
                data={ARAB_COUNTRIES}
                keyExtractor={item => item.iso}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    testID={`country-option-${item.iso}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.nameAr} +${item.dial}`}
                    accessibilityState={{ selected: item.iso === country.iso }}
                    onPress={() => selectCountry(item)}
                    style={styles.countryRow}
                  >
                    <View style={styles.countryNameRow}>
                      <FlagIcon iso={item.iso} size={18} />
                      <Text style={styles.countryName}>{item.nameAr}</Text>
                    </View>
                    <Text style={styles.countryRowDial}>+{item.dial}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.countryList}
              />
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  numericField: { textAlign: 'left', writingDirection: 'ltr' },
  phoneRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  mobileField: { flex: 1 },
  countryButton: {
    minWidth: 120,
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    backgroundColor: authColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  countryDial: { fontFamily: 'NotoKufiArabic-Bold', color: authColors.text },
  chevron: { color: authColors.hint },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  countrySheet: {
    backgroundColor: authColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  sheetHeader: { padding: 14, borderBottomWidth: 1, borderColor: '#eee' },
  sheetTitle: {
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 16,
    textAlign: 'center',
    color: authColors.modalText,
  },
  countryList: { paddingHorizontal: 6, paddingVertical: 8 },
  countryRow: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryNameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  countryName: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: authColors.modalText },
  countryRowDial: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: authColors.modalText },
  separator: { height: 1, backgroundColor: '#f0f0f0' },
  errorText: { color: '#ffb4ab' },
  busyButton: { opacity: 0.65 },
});
