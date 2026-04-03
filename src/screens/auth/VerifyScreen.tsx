// src/screens/auth/VerifyScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity, ActivityIndicator, Linking, Alert, AppState, AppStateStatus,
} from 'react-native';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BOT_USERNAME = 'tanami_auth_bot'; // ← your bot username (no @)

// Small helper to prefer tg:// and fallback to https://
async function openTelegramDeepLink(username: string, payload: string) {
  const tgUrl = `tg://resolve?domain=${username}&start=${encodeURIComponent(payload)}`;
  const httpUrl = `https://t.me/${username}?start=${encodeURIComponent(payload)}`;
  try {
    const supported = await Linking.canOpenURL(tgUrl);
    if (supported) return Linking.openURL(tgUrl);
    return Linking.openURL(httpUrl);
  } catch {
    Alert.alert('تعذر فتح تيليجرام', `افتح هذا الرابط يدويًا:\n${httpUrl}`);
  }
}

// Mask for display only (e.g., +963***80XXX)
const maskMobileForDisplay = (m: string) => {
  if (!m) return '';
  // keep country code if present
  const ccMatch = m.match(/^\+\d{1,3}/);
  const cc = ccMatch ? ccMatch[0] : '';
  const rest = m.replace(cc, '');
  if (rest.length <= 4) return `${cc}${'*'.repeat(Math.max(0, rest.length - 1))}${rest.slice(-1)}`;
  return `${cc}${'*'.repeat(Math.max(0, rest.length - 4))}${rest.slice(-4)}`;
};

const VerifyScreen: React.FC<any> = ({ route, navigation }) => {
  const { verifyOtp } = useAuth();
  const mobile = route.params?.mobile as string;

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  const [checking, setChecking] = useState(true);
  const [linked, setLinked] = useState<boolean | null>(null);

  // NEW: polling state
  const [polling, setPolling] = useState(false);
  const [pollSecondsLeft, setPollSecondsLeft] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const clearAllTimers = useCallback(() => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
    if (secondsTimerRef.current) { clearInterval(secondsTimerRef.current); secondsTimerRef.current = null; }
    setPolling(false);
    setPollSecondsLeft(0);
  }, []);

  const checkStatusOnce = useCallback(async () => {
    try {
      const { linked } = await api.telegramStatus(mobile);
      setLinked(linked);
      return linked;
    } catch (e: any) {
      console.warn('[Verify] telegram-status error:', e?.message);
      setLinked(null);
      return null;
    }
  }, [mobile]);

  // Initial status load
  useEffect(() => {
    (async () => {
      console.log('[Verify] check telegram-status for', mobile);
      setChecking(true);
      await checkStatusOnce();
      setChecking(false);
    })();
  }, [mobile, checkStatusOnce]);

  // NEW: polling runner
  const startPollingStatus = useCallback(async (totalSeconds = 60, everyMs = 3000) => {
    clearAllTimers();
    setPolling(true);
    setPollSecondsLeft(totalSeconds);

    // tick down visible countdown
    secondsTimerRef.current = setInterval(() => {
      setPollSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    // do an immediate check first
    const first = await checkStatusOnce();
    if (first) {
      console.log('[Verify] already linked; stop polling');
      clearAllTimers();
      return;
    }

    // repeating check
    pollIntervalRef.current = setInterval(async () => {
      const ok = await checkStatusOnce();
      if (ok) {
        console.log('[Verify] linked during polling; stop polling');
        clearAllTimers();
      }
    }, everyMs);

    // global timeout
    pollTimeoutRef.current = setTimeout(() => {
      console.log('[Verify] polling timeout reached; stopping');
      clearAllTimers();
    }, totalSeconds * 1000);
  }, [checkStatusOnce, clearAllTimers]);

  // NEW: refresh on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === 'active') {
        console.log('[Verify] app came to foreground → re-check telegram status');
        const ok = await checkStatusOnce();
        // If the user just came back from Telegram, give it a short polling window
        if (!ok) startPollingStatus(30, 3000); // 30s “light” poll
      }
    });
    return () => sub.remove();
  }, [checkStatusOnce, startPollingStatus]);

  // Manual actions
  const linkTelegram = async () => {
    try {
      console.log('[Verify] create link payload for', mobile);
      const { payload, code: shortCode } = await api.telegramCreateLink(mobile);
      await openTelegramDeepLink(BOT_USERNAME, payload);
      Alert.alert(
        'معلومة',
        `بعد الضغط على "ابدأ" داخل تيليجرام، سنحاول ربط الحساب تلقائيًا.\nإذا كانت المحادثة مع البوت مفتوحة من قبل، أرسل هذا الرمز هناك: ${shortCode}`
      );
      // Start aggressive polling (60s) right after opening Telegram
      startPollingStatus(60, 3000);
    } catch (e: any) {
      console.warn('[Verify] create link payload error:', e?.message);
      Alert.alert('خطأ', e?.response?.data?.error || e?.message || 'تعذر إنشاء رابط الربط');
    }
  };

  const refreshStatus = async () => {
    setChecking(true);
    await checkStatusOnce();
    setChecking(false);
  };

  const sendOtp = async () => {
    setResending(true);
    try {
      console.log('[Verify] send-otp for', mobile);
      const r = await api.sendOtp(mobile);
      console.log('[Verify] send-otp result:', r);
      Alert.alert('تم', 'تم إرسال رمز التحقق عبر تيليجرام.');
    } catch (e: any) {
      console.warn('[Verify] send-otp error:', e?.message);
      const msg = e?.response?.data?.error || e?.message || 'تعذر إرسال الرمز';
      Alert.alert('خطأ', msg);
    } finally {
      setResending(false);
    }
  };

  const onVerify = async () => {
    const val = code.trim();
    if (val.length < 6) return Alert.alert('تنبيه', 'يرجى إدخال الرمز المؤلف من 6 أرقام');
    setBusy(true);
    try {
      console.log('[Verify] verify', { mobile, code: val });
      await verifyOtp(mobile, val);
      console.log('[Verify] verify ok → navigate MainTabs');
      clearAllTimers();
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e: any) {
      console.warn('[Verify] verify error:', e?.message);
      Alert.alert('خطأ', e?.response?.data?.error || e?.message || 'رمز غير صحيح أو منتهي');
    } finally {
      setBusy(false);
    }
  };

  // Cleanup
  useEffect(() => clearAllTimers, [clearAllTimers]);

  const masked = maskMobileForDisplay(mobile);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 16 }}>
      {/* Intro + Top Send */}
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 18, textAlign: 'center', marginVertical: 12, color: '#0f4f30' }}>
        أدخل رمز التحقق
      </Text>

      <Text style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'NotoKufiArabic-Regular', color: '#0f4f30' }}>
        سيتم إرسال الرمز إلى الرقم {masked}. الرجاء الضغط على زر "إرسال الرمز".
      </Text>

      {/* Top-level Send button */}
      <TouchableOpacity
        onPress={sendOtp}
        style={{
          backgroundColor: linked ? '#1B5E20' : '#CBD5E1', // new colors (enabled/disabled)
          borderRadius: 8,
          paddingVertical: 8,         // smaller height
          paddingHorizontal: 14,      // smaller width
          alignItems: 'center',
          alignSelf: 'center',        // keeps it neat in the center
          marginBottom: 12,
          opacity: (resending || !linked) ? 0.7 : 1,
        }}
        disabled={resending || !linked}
      >
        {resending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text
            style={{
              color: linked ? '#FFFFFF' : '#475569', // readable text on both states
              fontFamily: 'NotoKufiArabic-Bold',
              fontSize: 14,                           // slightly smaller text
            }}
          >
            إرسال الرمز
          </Text>
        )}
      </TouchableOpacity>

      {/* OTP input then Verify */}
      <TextInput
        placeholder="الرمز (6 أرقام)"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 12, textAlign: 'center', letterSpacing: 4 }}
      />

      <TouchableOpacity
        onPress={onVerify}
        style={{ backgroundColor: '#0f4f30', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 12 }}
        disabled={busy}
      >
        {busy ? <ActivityIndicator color="#eceadf" /> : <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>تأكيد</Text>}
      </TouchableOpacity>

      {/* Status / guidance */}
      {checking ? (
        <Text style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'NotoKufiArabic-Regular', color: '#0f4f30' }}>
          جاري التحقق من حالة تيليجرام...
        </Text>
      ) : linked ? (
        <Text style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'NotoKufiArabic-Regular', color: '#0f4f30' }}>
          تم ربط حسابك استقبل الرمز على تليغرام
        </Text>
      ) : (
        <Text style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'NotoKufiArabic-Regular', color: '#0f4f30' }}>
          الحساب غير مرتبط بتيليجرام. اربط تيليجرام أولًا ثم أعد المحاولة.
        </Text>
      )}

      {/* Polling indicator */}
      {polling && (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 6, color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular' }}>
            بانتظار ربط تيليجرام... ({pollSecondsLeft}s)
          </Text>
        </View>
      )}

      {/* Telegram helper actions */}
      <View style={{ marginTop: 8, alignItems: 'center' }}>
        {!checking && linked === false && (
          <>
            <TouchableOpacity onPress={async () => {
              // same as original link flow
              try {
                const { payload, code: shortCode } = await api.telegramCreateLink(mobile);
                await openTelegramDeepLink(BOT_USERNAME, payload);
                Alert.alert(
                  'معلومة',
                  `بعد الضغط على "ابدأ" داخل تيليجرام، سنحاول ربط الحساب تلقائيًا.\nإذا كانت المحادثة مع البوت مفتوحة من قبل، أرسل هذا الرمز هناك: ${shortCode}`
                );
                startPollingStatus(60, 3000);
              } catch (e: any) {
                console.warn('[Verify] create link payload error:', e?.message);
                Alert.alert('خطأ', e?.response?.data?.error || e?.message || 'تعذر إنشاء رابط الربط');
              }
            }} style={{ marginVertical: 8 }}>
              <Text style={{ color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular' }}>اربط تيليجرام لاستلام الرمز</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={async () => {
              setChecking(true);
              await checkStatusOnce();
              setChecking(false);
            }} style={{ marginVertical: 8 }}>
              <Text style={{ color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular' }}>
                تحديث الحالة {polling && pollSecondsLeft ? `(${pollSecondsLeft}s)` : ''}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Keep legacy resend for parity (still calls sendOtp) */}
        <TouchableOpacity
          onPress={sendOtp}
          disabled={resending || !linked}
          activeOpacity={0.6}
          accessibilityRole="link"
          style={{
            marginTop: 8,
            width: 150,          // keep your fixed width
            alignSelf: 'center', // center horizontally
          }}
        >
          <Text
            style={{
              color: linked ? '#0f4f30' : '#8aa096',
              fontFamily: 'NotoKufiArabic-Regular',
              textAlign: 'center',
              textDecorationLine: 'underline',
              textDecorationStyle: 'solid',
              textDecorationColor: linked ? '#0f4f30' : '#8aa096',
            }}
          >
            {resending ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VerifyScreen;
