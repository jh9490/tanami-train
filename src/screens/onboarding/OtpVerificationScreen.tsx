import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  canAccessOtpStep,
  canResendOtp,
  canVerifyOtp,
  selectOtpSecondsRemaining,
  selectResendSecondsRemaining,
  secondsUntil,
} from '../../auth/onboardingReducer';
import {
  getAttemptsRemainingMessage,
  getOnboardingErrorMessage,
  getRetryCountdownMessage,
  ONBOARDING_COPY,
} from '../../auth/onboardingErrors';
import { authColors, authStyles } from '../../auth/ui';
import ThemedBackground from '../components/ThemedBackground';
import { useOnboardingFlow } from './OnboardingFlowProvider';

const maskMobile = (mobile: string) => {
  if (mobile.length <= 4) return mobile;
  return `${mobile.slice(0, 3)}${'*'.repeat(Math.max(2, mobile.length - 7))}${mobile.slice(-4)}`;
};

export default function OtpVerificationScreen({ navigation }: any) {
  const { state, resend, verify, restart } = useOnboardingFlow();
  const [code, setCode] = useState('');
  const [clock, setClock] = useState(Date.now());
  const [busy, setBusy] = useState<'verify' | 'resend' | null>(null);

  const otpSeconds = selectOtpSecondsRemaining(state, clock);
  const resendSeconds = selectResendSecondsRemaining(state, clock);
  const verifyRetrySeconds = secondsUntil(state.verifyDisabledUntil, clock);

  useEffect(() => {
    if (!canAccessOtpStep(state)) navigation.replace('TraineeType');
  }, [navigation, state]);

  useEffect(() => {
    if (state.error?.code === 'invalid_code') setCode('');
  }, [state.error?.code]);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1_000);
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') setClock(Date.now());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  const submitCode = async () => {
    if (!/^\d{6}$/.test(code) || !canVerifyOtp(state, Date.now())) return;
    setBusy('verify');
    const response = await verify(code);
    setBusy(null);
    if (response) {
      setCode('');
      navigation.replace('AccountCompletion');
    }
  };

  const requestResend = async () => {
    if (!canResendOtp(state, Date.now())) return;
    setBusy('resend');
    await resend();
    setBusy(null);
  };

  const restartFlow = () => {
    setCode('');
    restart();
    navigation.replace('TraineeType');
  };

  return (
    <ThemedBackground>
      <KeyboardAvoidingView style={authStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={authStyles.hero}>
            <View style={authStyles.pill}><Text style={authStyles.pillText}>التحقق من الجوال</Text></View>
            <Text style={authStyles.title}>أدخل رمز التحقق</Text>
            <Text style={authStyles.subtitle}>{ONBOARDING_COPY.neutralCodeSent.ar}</Text>
            <Text style={authStyles.centerText}>{maskMobile(state.mobile)}</Text>
          </View>

          <View style={authStyles.card}>
            <TextInput
              testID="otp-input"
              accessibilityLabel="رمز التحقق المكون من ستة أرقام / Six-digit verification code"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))}
              style={[authStyles.field, styles.otpField]}
            />

            <Text accessibilityLiveRegion="polite" style={authStyles.centerText}>
              {otpSeconds > 0 ? `تنتهي صلاحية الرمز بعد ${otpSeconds} ثانية` : 'انتهت صلاحية الرمز'}
            </Text>

            {state.error ? (
              <View>
                <Text testID="otp-error" accessibilityLiveRegion="polite" style={[authStyles.centerText, styles.errorText]}>
                  {getOnboardingErrorMessage(state.error)}
                </Text>
                {state.error.attemptsRemaining !== null ? (
                  <Text accessibilityLiveRegion="polite" style={authStyles.centerText}>
                    {getAttemptsRemainingMessage(state.error.attemptsRemaining)}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {verifyRetrySeconds > 0 ? (
              <Text accessibilityLiveRegion="polite" style={authStyles.centerText}>
                {getRetryCountdownMessage(verifyRetrySeconds)}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="verify-button"
              accessibilityRole="button"
              accessibilityLabel="تأكيد الرمز / Verify code"
              accessibilityState={{ disabled: busy !== null || code.length !== 6 || !canVerifyOtp(state, clock), busy: busy === 'verify' }}
              disabled={busy !== null || code.length !== 6 || !canVerifyOtp(state, clock)}
              onPress={submitCode}
              style={[authStyles.primaryButton, (busy !== null || code.length !== 6 || !canVerifyOtp(state, clock)) && styles.disabledButton]}
            >
              {busy === 'verify' ? <ActivityIndicator color={authColors.white} /> : <Text style={authStyles.primaryButtonText}>تأكيد الرمز</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              testID="resend-button"
              accessibilityRole="button"
              accessibilityLabel="إعادة إرسال الرمز / Resend code"
              accessibilityState={{ disabled: busy !== null || !canResendOtp(state, clock), busy: busy === 'resend' }}
              disabled={busy !== null || !canResendOtp(state, clock)}
              onPress={requestResend}
              style={authStyles.actionLink}
            >
              <Text style={authStyles.actionLinkText}>
                {resendSeconds > 0 ? `إعادة الإرسال بعد ${resendSeconds} ثانية` : 'إعادة إرسال الرمز'}
              </Text>
            </TouchableOpacity>

            {otpSeconds === 0 || state.error?.code === 'invalid_session' ? (
              <TouchableOpacity accessibilityRole="button" onPress={restartFlow} style={authStyles.actionLink}>
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
  otpField: { textAlign: 'center', writingDirection: 'ltr', letterSpacing: 5 },
  errorText: { color: '#ffb4ab' },
  disabledButton: { opacity: 0.55 },
});
