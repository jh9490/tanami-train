import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  getOtpDeliveryActionLabel,
  getOtpDeliveryHint,
  getOtpDeliverySuccessMessage,
  getOtpDeliveryTitle,
  mapAuthError,
  OtpDeliveryMethod,
  OtpFlowContext,
} from '../../auth/otp';
import { authColors, authStyles } from '../../auth/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const maskMobileForDisplay = (m: string) => {
  if (!m) return '';
  const ccMatch = m.match(/^\+\d{1,3}/);
  const cc = ccMatch ? ccMatch[0] : '';
  const rest = m.replace(cc, '');
  if (rest.length <= 4) return `${cc}${'*'.repeat(Math.max(0, rest.length - 1))}${rest.slice(-1)}`;
  return `${cc}${'*'.repeat(Math.max(0, rest.length - 4))}${rest.slice(-4)}`;
};

const VerifyScreen: React.FC<any> = ({ route, navigation }) => {
  const { verifyOtp } = useAuth();
  const insets = useSafeAreaInsets();
  const mobile = route.params?.mobile as string;
  const context = (route.params?.context as OtpFlowContext | undefined) ?? 'signup';
  const deliveryMethod =
    (route.params?.deliveryMethod as OtpDeliveryMethod | undefined) ?? 'whatsapp';

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  const requestOtp = async (reason: 'initial' | 'resend' = 'initial') => {
    setResending(true);
    try {
      await api.sendOtp(mobile, reason, deliveryMethod);
      Alert.alert('تم', getOtpDeliverySuccessMessage(deliveryMethod, context));
    } catch (e: any) {
      Alert.alert('خطأ', mapAuthError(e?.response?.data?.error || e?.message));
    } finally {
      setResending(false);
    }
  };

  const onVerify = async () => {
    const val = code.trim();
    if (val.length < 6) return Alert.alert('تنبيه', 'يرجى إدخال الرمز المؤلف من 6 أرقام');
    setBusy(true);
    try {
      await verifyOtp(mobile, val);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e: any) {
      console.warn('[Verify] verify error:', e?.message);
    } finally {
      setBusy(false);
    }
  };

  const masked = maskMobileForDisplay(mobile);
  const title = context === 'signin' ? 'تفعيل الحساب' : 'أدخل رمز التحقق';

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
            <Text style={authStyles.pillText}>{getOtpDeliveryTitle(deliveryMethod)}</Text>
          </View>
          <Text style={authStyles.title}>{title}</Text>
          <Text style={authStyles.subtitle}>{getOtpDeliveryHint(deliveryMethod, masked)}</Text>
        </View>

        <View style={authStyles.card}>
          <TouchableOpacity
            onPress={() => requestOtp('initial')}
            style={[
              authStyles.primaryButton,
              resending && { backgroundColor: '#9cb3a4', shadowOpacity: 0 },
            ]}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator color={authColors.white} />
            ) : (
              <Text style={authStyles.primaryButtonText}>
                {getOtpDeliveryActionLabel(deliveryMethod, context)}
              </Text>
            )}
          </TouchableOpacity>

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

          <TouchableOpacity
            onPress={onVerify}
            style={authStyles.primaryButton}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={authColors.white} />
            ) : (
              <Text style={authStyles.primaryButtonText}>تأكيد الرمز</Text>
            )}
          </TouchableOpacity>

          <Text style={authStyles.centerText}>
            سيتم إرسال رمز التحقق إلى رقمك المسجل عبر واتساب.
          </Text>

          <TouchableOpacity
            onPress={() => requestOtp('resend')}
            disabled={resending}
            activeOpacity={0.6}
            accessibilityRole="link"
            style={authStyles.actionLink}
          >
            <Text
              style={[
                authStyles.actionLinkText,
                {
                  color: resending ? '#8aa096' : authColors.primary,
                  textDecorationLine: 'underline',
                },
              ]}
            >
              {resending ? 'جاري الإرسال...' : 'إعادة إرسال الرمز عبر واتساب'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default VerifyScreen;
