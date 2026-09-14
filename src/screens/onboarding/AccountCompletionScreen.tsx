import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { canAccessCompletionStep } from '../../auth/onboardingReducer';
import { getOnboardingErrorMessage } from '../../auth/onboardingErrors';
import { authColors, authStyles } from '../../auth/ui';
import ThemedBackground from '../components/ThemedBackground';
import { useOnboardingFlow } from './OnboardingFlowProvider';

export default function AccountCompletionScreen({ navigation }: any) {
  const { state, complete, restart } = useOnboardingFlow();
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = state.completionStatus === 'submitting';

  useEffect(() => {
    if (!canAccessCompletionStep(state)) navigation.replace('TraineeType');
  }, [navigation, state]);

  const submit = async () => {
    if (password.length < 8) {
      setLocalError('يجب ألا تقل كلمة المرور عن 8 أحرف.');
      return;
    }

    const response = await complete(password);
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
            <Text style={authStyles.title}>أنشئ كلمة المرور</Text>
            <Text style={authStyles.subtitle}>
              أدخل كلمة مرور لا تقل عن 8 أحرف لإكمال تسجيل حسابك.
            </Text>
          </View>

          <View style={authStyles.card}>
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
  passwordField: { textAlign: 'left', writingDirection: 'ltr' },
  errorText: { color: '#ffb4ab' },
  busyButton: { opacity: 0.65 },
});
