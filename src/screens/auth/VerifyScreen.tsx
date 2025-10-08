// src/screens/auth/VerifyScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const VerifyScreen: React.FC<any> = ({ route, navigation }) => {
  const { verifyOtp } = useAuth();
  const mobile = route.params?.mobile as string;
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  const onVerify = async () => {
    setBusy(true);
    try {
      await verifyOtp(mobile, code.trim());
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await api.resendOtp(mobile);
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 16 }}>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 18, textAlign: 'center', marginVertical: 12  ,  color : "#0f4f30"}}>
        أدخل رمز التحقق
      </Text>
      <Text style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'NotoKufiArabic-Regular'  ,  color : "#0f4f30"}}>
        تم إرسال الرمز إلى {mobile}
      </Text>
      <TextInput
        placeholder="الرمز"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'center', letterSpacing: 4 }}
      />
      <TouchableOpacity onPress={onVerify} style={{ backgroundColor: '#0f4f30', borderRadius: 10, padding: 14, alignItems: 'center' }} disabled={busy}>
        {busy ? <ActivityIndicator color="#eceadf" /> : <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>تأكيد</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={onResend} style={{ marginTop: 16, alignSelf: 'center' }} disabled={resending}>
        <Text style={{ color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular' }}>
          {resending ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
export default VerifyScreen;
