// src/screens/auth/ResetPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type Step = 'request' | 'verify';

const ResetPasswordScreen: React.FC<any> = ({ navigation }) => {
  const { signIn } = useAuth(); // optional if you want auto-login after reset
  const [step, setStep] = useState<Step>('request');

  const [mobile, setMobile] = useState('');
  const [busy, setBusy] = useState(false);

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const onRequest = async () => {
    if (!mobile.trim()) return Alert.alert('تنبيه', 'الرجاء إدخال رقم الجوال.');
    setBusy(true);
    try {
      await api.passwordResetRequest(mobile.trim());
      setStep('verify');
      Alert.alert('تم', 'تم إرسال رمز إعادة التعيين.');
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر الإرسال.');
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (!code.trim() || !password) return Alert.alert('تنبيه', 'أدخل الرمز وكلمة المرور الجديدة.');
    setBusy(true);
    try {
      const res = await api.passwordResetVerify(mobile.trim(), code.trim(), password);
      // Option A: navigate to SignIn
      Alert.alert('تم', 'تم تغيير كلمة المرور. سجّل الدخول.');
      navigation.reset({ index: 0, routes: [{ name: 'AuthStack', params: { screen: 'SignIn' } }] });

      // Option B (auto-login): 
      // await signIn(mobile.trim(), password);
      // navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر التحقق.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 16 }}>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 18, textAlign: 'center', marginVertical: 12 }}>
        {step === 'request' ? 'إعادة تعيين كلمة المرور' : 'أدخل رمز التحقق وكلمة المرور الجديدة'}
      </Text>

      {/* Step 1: Request */}
      {step === 'request' && (
        <>
          <TextInput
            placeholder="رقم الجوال"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'right' }}
          />
          <TouchableOpacity
            onPress={onRequest}
            style={{ backgroundColor: '#0f4f30', borderRadius: 10, padding: 14, alignItems: 'center' }}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color="#eceadf" /> : <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>إرسال الرمز</Text>}
          </TouchableOpacity>
        </>
      )}

      {/* Step 2: Verify */}
      {step === 'verify' && (
        <>
          <TextInput
            placeholder="رمز التحقق"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'center', letterSpacing: 4 }}
            maxLength={6}
          />
          <TextInput
            placeholder="كلمة المرور الجديدة"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'right' }}
          />
          <TouchableOpacity
            onPress={onVerify}
            style={{ backgroundColor: '#0f4f30', borderRadius: 10, padding: 14, alignItems: 'center' }}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color="#eceadf" /> : <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>تأكيد</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default ResetPasswordScreen;
