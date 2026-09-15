import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { canAccessCompletionStep } from '../../auth/onboardingReducer';
import { getOnboardingErrorMessage } from '../../auth/onboardingErrors';
import { authColors, authStyles } from '../../auth/ui';
import {
  dateOnlyToPickerDate,
  pickerDateToDateOnly,
  todayAsUtcCalendarDate,
} from '../../util/dateOnly';
import ThemedBackground from '../components/ThemedBackground';
import { useOnboardingFlow } from './OnboardingFlowProvider';

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function AccountCompletionScreen({ navigation }: any) {
  const { state, complete, restart } = useOnboardingFlow();
  const isNewTrainee = state.traineeType === 'new';
  const [fullnameAr, setFullnameAr] = useState('');
  const [fullnameEn, setFullnameEn] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = state.completionStatus === 'submitting';

  useEffect(() => {
    if (!canAccessCompletionStep(state)) navigation.replace('TraineeType');
  }, [navigation, state]);

  const submit = async () => {
    if (isNewTrainee && !fullnameAr.trim()) {
      setLocalError('الاسم الكامل بالعربية مطلوب.');
      return;
    }
    if (isNewTrainee && email.trim() && !isEmail(email.trim())) {
      setLocalError('صيغة البريد الإلكتروني غير صحيحة.');
      return;
    }
    if (password.length < 8) {
      setLocalError('يجب ألا تقل كلمة المرور عن 8 أحرف.');
      return;
    }

    const response = await complete({
      password,
      ...(isNewTrainee ? {
        fullnameAr,
        fullnameEn,
        email,
        dateOfBirth,
      } : {}),
    });
    if (!response) return;

    setPassword('');
    const parent = navigation.getParent?.()?.getParent?.();
    const reset = { index: 0, routes: [{ name: 'MainTabs' }] };
    if (parent?.reset) parent.reset(reset);
    else navigation.reset?.(reset);
  };

  const restartFlow = () => {
    setPassword('');
    restart();
    navigation.replace('TraineeType');
  };

  const onChangeDob = (_event: unknown, picked?: Date) => {
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (picked) {
      setDateOfBirth(pickerDateToDateOnly(picked));
      setLocalError(null);
    }
  };

  return (
    <ThemedBackground>
      <KeyboardAvoidingView
        style={authStyles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={authStyles.hero}>
            <View style={authStyles.pill}>
              <Text style={authStyles.pillText}>إكمال التسجيل</Text>
            </View>
            <Text style={authStyles.title}>
              {isNewTrainee ? 'أدخل بياناتك' : 'أنشئ كلمة المرور'}
            </Text>
            <Text style={authStyles.subtitle}>
              {isNewTrainee
                ? 'أكمل بياناتك الأساسية وأنشئ كلمة مرور لإتمام التسجيل.'
                : 'أدخل كلمة مرور لا تقل عن 8 أحرف لإكمال تسجيل حسابك.'}
            </Text>
          </View>

          <View style={authStyles.card}>
            {isNewTrainee ? (
              <>
                <Text style={authStyles.sectionTitle}>الاسم الكامل بالعربية *</Text>
                <TextInput
                  testID="fullname-ar-input"
                  accessibilityLabel="الاسم الكامل بالعربية"
                  value={fullnameAr}
                  onChangeText={value => {
                    setFullnameAr(value);
                    setLocalError(null);
                  }}
                  placeholder="اكتب اسمك الكامل بالعربية"
                  style={authStyles.field}
                  textAlign="right"
                  returnKeyType="next"
                />

                <Text style={authStyles.sectionTitle}>الاسم الكامل بالإنجليزية (اختياري)</Text>
                <TextInput
                  testID="fullname-en-input"
                  accessibilityLabel="Full name in English"
                  value={fullnameEn}
                  onChangeText={value => {
                    setFullnameEn(value);
                    setLocalError(null);
                  }}
                  placeholder="Full name in English"
                  style={[authStyles.field, styles.ltrField]}
                  autoCapitalize="words"
                  returnKeyType="next"
                />

                <Text style={authStyles.sectionTitle}>البريد الإلكتروني (اختياري)</Text>
                <TextInput
                  testID="email-input"
                  accessibilityLabel="البريد الإلكتروني / Email"
                  value={email}
                  onChangeText={value => {
                    setEmail(value);
                    setLocalError(null);
                  }}
                  placeholder="email@example.com"
                  style={[authStyles.field, styles.ltrField]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                <Text style={authStyles.sectionTitle}>تاريخ الميلاد (اختياري)</Text>
                <TouchableOpacity
                  testID="date-of-birth-button"
                  accessibilityRole="button"
                  accessibilityLabel="اختيار تاريخ الميلاد"
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowDobPicker(true);
                  }}
                >
                  <View pointerEvents="none">
                    <TextInput
                      testID="date-of-birth-input"
                      value={dateOfBirth}
                      editable={false}
                      placeholder="YYYY-MM-DD"
                      style={[authStyles.field, styles.ltrField]}
                    />
                  </View>
                </TouchableOpacity>

                {showDobPicker ? (
                  <DateTimePicker
                    testID="date-of-birth-picker"
                    value={dateOnlyToPickerDate(dateOfBirth)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    maximumDate={todayAsUtcCalendarDate()}
                    timeZoneName="UTC"
                    onChange={onChangeDob}
                  />
                ) : null}
              </>
            ) : null}

            <Text style={authStyles.sectionTitle}>كلمة المرور</Text>
            <TextInput
              testID="password-input"
              accessibilityLabel="كلمة المرور / Password"
              value={password}
              onChangeText={value => {
                setPassword(value);
                setLocalError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              placeholder="8 أحرف على الأقل"
              style={[authStyles.field, styles.passwordField]}
            />

            {localError || state.error ? (
              <Text
                testID="completion-error"
                accessibilityLiveRegion="polite"
                style={[authStyles.centerText, styles.errorText]}
              >
                {localError || getOnboardingErrorMessage(state.error)}
              </Text>
            ) : null}

            <TouchableOpacity
              testID={state.completionStatus === 'retryable' ? 'retry-completion-button' : 'complete-button'}
              accessibilityRole="button"
              accessibilityLabel="إكمال التسجيل / Complete registration"
              accessibilityState={{ disabled: busy, busy }}
              disabled={busy}
              onPress={submit}
              style={[authStyles.primaryButton, busy && styles.busyButton]}
            >
              {busy ? (
                <ActivityIndicator color={authColors.white} />
              ) : (
                <Text style={authStyles.primaryButtonText}>
                  {state.completionStatus === 'retryable' ? 'إعادة المحاولة' : 'إكمال التسجيل'}
                </Text>
              )}
            </TouchableOpacity>

            {state.error?.code === 'verification_required' ? (
              <TouchableOpacity onPress={restartFlow} style={authStyles.actionLink}>
                <Text style={authStyles.subtleLinkText}>البدء مجددًا</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  ltrField: { textAlign: 'left', writingDirection: 'ltr', direction: 'ltr' },
  passwordField: { textAlign: 'left', writingDirection: 'ltr', direction: 'ltr' },
  errorText: { color: '#ffb4ab' },
  busyButton: { opacity: 0.65 },
});
