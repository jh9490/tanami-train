import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  ActivityIndicator,
  Alert,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

const BOT_USERNAME = 'tanami_auth_bot';

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
    (route.params?.deliveryMethod as OtpDeliveryMethod | undefined) ?? 'telegram';
  const isSms = deliveryMethod === 'sms';

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(!isSms);
  const [linked, setLinked] = useState<boolean | null>(isSms ? true : null);
  const [polling, setPolling] = useState(false);
  const [pollSecondsLeft, setPollSecondsLeft] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const clearAllTimers = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (secondsTimerRef.current) {
      clearInterval(secondsTimerRef.current);
      secondsTimerRef.current = null;
    }
    setPolling(false);
    setPollSecondsLeft(0);
  }, []);

  const checkStatusOnce = useCallback(async () => {
    if (isSms) {
      setLinked(true);
      return true;
    }

    try {
      const status = await api.telegramStatus(mobile);
      setLinked(status.linked);
      return status.linked;
    } catch (e: any) {
      console.warn('[Verify] telegram-status error:', e?.message);
      setLinked(null);
      return null;
    }
  }, [isSms, mobile]);

  useEffect(() => {
    if (isSms) {
      setChecking(false);
      setLinked(true);
      return;
    }

    (async () => {
      setChecking(true);
      await checkStatusOnce();
      setChecking(false);
    })();
  }, [checkStatusOnce, isSms]);

  const startPollingStatus = useCallback(
    async (totalSeconds = 60, everyMs = 3000) => {
      if (isSms) return;

      clearAllTimers();
      setPolling(true);
      setPollSecondsLeft(totalSeconds);

      secondsTimerRef.current = setInterval(() => {
        setPollSecondsLeft(s => (s > 0 ? s - 1 : 0));
      }, 1000);

      const first = await checkStatusOnce();
      if (first) {
        clearAllTimers();
        return;
      }

      pollIntervalRef.current = setInterval(async () => {
        const ok = await checkStatusOnce();
        if (ok) {
          clearAllTimers();
        }
      }, everyMs);

      pollTimeoutRef.current = setTimeout(() => {
        clearAllTimers();
      }, totalSeconds * 1000);
    },
    [checkStatusOnce, clearAllTimers, isSms],
  );

  useEffect(() => {
    if (isSms) return;

    const sub = AppState.addEventListener('change', async nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === 'active') {
        const ok = await checkStatusOnce();
        if (!ok) startPollingStatus(30, 3000);
      }
    });

    return () => sub.remove();
  }, [checkStatusOnce, isSms, startPollingStatus]);

  const linkTelegram = async () => {
    try {
      const { payload, code: shortCode } = await api.telegramCreateLink(mobile);
      await openTelegramDeepLink(BOT_USERNAME, payload);
      Alert.alert(
        'معلومة',
        `بعد الضغط على "ابدأ" داخل تيليجرام سنحاول ربط الحساب تلقائياً.\nإذا كانت المحادثة مفتوحة مسبقاً، أرسل هذا الرمز هناك: ${shortCode}`,
      );
      startPollingStatus(60, 3000);
    } catch (e: any) {
      Alert.alert('خطأ', mapAuthError(e?.response?.data?.error || e?.message));
    }
  };

  const refreshStatus = async () => {
    if (isSms) return;
    setChecking(true);
    await checkStatusOnce();
    setChecking(false);
  };

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
      clearAllTimers();
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e: any) {
      console.warn('[Verify] verify error:', e?.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => clearAllTimers, [clearAllTimers]);

  const masked = maskMobileForDisplay(mobile);
  const sendDisabled = resending || (!isSms && !linked);
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
              sendDisabled && { backgroundColor: '#9cb3a4', shadowOpacity: 0 },
            ]}
            disabled={sendDisabled}
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

          {isSms ? (
            <Text style={authStyles.centerText}>
              سيتم إرسال رمز التحقق إلى رقمك المسجل عبر رسالة نصية.
            </Text>
          ) : checking ? (
            <Text style={authStyles.centerText}>جاري التحقق من حالة تيليجرام...</Text>
          ) : linked ? (
            <Text style={authStyles.centerText}>
              الحساب مرتبط بتيليجرام ويمكنك طلب رمز التحقق الآن.
            </Text>
          ) : (
            <Text style={authStyles.centerText}>
              الحساب غير مرتبط بتيليجرام. أكمل الربط أولاً ثم اطلب الرمز.
            </Text>
          )}

          {!isSms && polling && (
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <ActivityIndicator />
              <Text style={[authStyles.centerText, { marginTop: 8 }]}>
                بانتظار ربط تيليجرام... ({pollSecondsLeft}s)
              </Text>
            </View>
          )}

          {!isSms && !checking && linked === false && (
            <>
              <TouchableOpacity onPress={linkTelegram} style={authStyles.actionLink}>
                <Text style={authStyles.actionLinkText}>ربط تيليجرام</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={refreshStatus} style={authStyles.actionLink}>
                <Text style={authStyles.subtleLinkText}>
                  تحديث الحالة {polling && pollSecondsLeft ? `(${pollSecondsLeft}s)` : ''}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() => requestOtp('resend')}
            disabled={sendDisabled}
            activeOpacity={0.6}
            accessibilityRole="link"
            style={authStyles.actionLink}
          >
            <Text
              style={[
                authStyles.actionLinkText,
                {
                  color: sendDisabled ? '#8aa096' : authColors.primary,
                  textDecorationLine: 'underline',
                },
              ]}
            >
              {resending
                ? 'جاري الإرسال...'
                : isSms
                  ? 'إعادة إرسال الرمز عبر رسالة نصية'
                  : 'إعادة إرسال الرمز عبر تيليجرام'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default VerifyScreen;
