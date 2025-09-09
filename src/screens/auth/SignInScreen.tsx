// src/screens/auth/SignInScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, I18nManager } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const SignInScreen: React.FC<any> = ({ navigation }) => {
  const { signIn, isAuthenticated } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signIn(mobile.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] }); // ارجع للبيت
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 16 }}>
      <TextInput
        placeholder="رقم الجوال"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'right' }}
      />
      <TextInput
        placeholder="كلمة المرور"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'right' }}
      />
      <TouchableOpacity
        onPress={onSubmit}
        style={{ backgroundColor: '#0f4f30', borderRadius: 10, padding: 14, alignItems: 'center' }}
        disabled={busy}
      >
        {busy ? <ActivityIndicator color="#eceadf" /> : <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>دخول</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 16, alignSelf: 'center' }} onPress={() => navigation.navigate('SignUp')}>
        <Text style={{ color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular' }}>ليس لديك حساب؟ أنشئ حسابًا الآن</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 12, alignSelf: 'center' }}
        onPress={() => navigation.navigate('ResetPassword')}
      >
        <Text style={{ color: '#555', fontFamily: 'NotoKufiArabic-Regular' }}>
          نسيت كلمة المرور؟
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignInScreen;
