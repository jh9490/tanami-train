// src/screens/auth/SignUpScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const SignUpScreen: React.FC<any> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await signUp(mobile.trim(), password, email.trim() || undefined);
      navigation.navigate('OtpVerify', { mobile: mobile.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 16 }}>
      {<Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 10, textAlign: 'center', marginVertical: 12 }}>
       في حال كنت متدربا سابقا يفضل ان تسجل بنفس رقم هاتفك المسجل لدى تنامي ترين
      </Text> }
      <TextInput placeholder="رقم الجوال" keyboardType="phone-pad" value={mobile} onChangeText={setMobile}
        style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'right' , color:'#0f4f30', fontWeight: 'bold'}} />
      <TextInput placeholder="البريد الإلكتروني (اختياري)" keyboardType="email-address" value={email} onChangeText={setEmail}
        style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'right' , color:'#0f4f30', fontWeight: 'bold' }} />
      <TextInput placeholder="كلمة المرور" secureTextEntry value={password} onChangeText={setPassword}
        style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'right' , color:'#0f4f30', fontWeight: 'bold' }} />
      <TouchableOpacity onPress={onSubmit} style={{ backgroundColor: '#0f4f30', borderRadius: 10, padding: 14, alignItems: 'center' }} disabled={busy}>
        {busy ? <ActivityIndicator color="#eceadf" /> : <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>إنشاء</Text>}
      </TouchableOpacity>
    </View>
  );
};
export default SignUpScreen;
