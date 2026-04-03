// src/screens/auth/SignUpScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  FlatList,
  Pressable,
  I18nManager,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { buildE164, digitsOnly, stripLeadingZero } from '../../util/phone';
import FlagIcon from '../../util/FlagIcon';

const BOT_USERNAME = 'TanamiTrain_bot'; // ← change if needed

// Arabic countries only (dial code as string; flag via emoji for light UI)
const ARAB_COUNTRIES = [
  { nameAr: 'السعودية', iso: 'SA', dial: '966', flag: '' },
  { nameAr: 'الإمارات', iso: 'AE', dial: '971', flag: '🇦🇪' },
  { nameAr: 'قطر', iso: 'QA', dial: '974', flag: '🇶🇦' },
  { nameAr: 'الكويت', iso: 'KW', dial: '965', flag: '🇰🇼' },
  { nameAr: 'البحرين', iso: 'BH', dial: '973', flag: '🇧🇭' },
  { nameAr: 'عُمان', iso: 'OM', dial: '968', flag: '🇴🇲' },
  { nameAr: 'الأردن', iso: 'JO', dial: '962', flag: '🇯🇴' },
  { nameAr: 'لبنان', iso: 'LB', dial: '961', flag: '🇱🇧' },
  { nameAr: 'سوريا', iso: 'SY', dial: '963', flag: '' },
  { nameAr: 'العراق', iso: 'IQ', dial: '964', flag: '🇮🇶' },
  { nameAr: 'مصر', iso: 'EG', dial: '20', flag: '🇪🇬' },
  { nameAr: 'اليمن', iso: 'YE', dial: '967', flag: '🇾🇪' },
  { nameAr: 'فلسطين', iso: 'PS', dial: '970', flag: '🇵🇸' },
  { nameAr: 'السودان', iso: 'SD', dial: '249', flag: '🇸🇩' },
  { nameAr: 'الجزائر', iso: 'DZ', dial: '213', flag: '🇩🇿' },
  { nameAr: 'المغرب', iso: 'MA', dial: '212', flag: '🇲🇦' },
  { nameAr: 'تونس', iso: 'TN', dial: '216', flag: '🇹🇳' },
  { nameAr: 'ليبيا', iso: 'LY', dial: '218', flag: '🇱🇾' },
  { nameAr: 'موريتانيا', iso: 'MR', dial: '222', flag: '🇲🇷' },
  { nameAr: 'الصومال', iso: 'SO', dial: '252', flag: '🇸🇴' },
  { nameAr: 'جيبوتي', iso: 'DJ', dial: '253', flag: '🇩🇯' },
  { nameAr: 'جزر القمر', iso: 'KM', dial: '269', flag: '🇰🇲' },
];

const SignUpScreen: React.FC<any> = ({ navigation }) => {
  const { signUp } = useAuth();

  // picker state
  const [country, setCountry] = useState(() => ARAB_COUNTRIES.find(c => c.iso === 'SY') || ARAB_COUNTRIES[0]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // form state
  const [mobileLocal, setMobileLocal] = useState(''); // national number only
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const fullMobile = useMemo(
    () => buildE164(country.dial, mobileLocal),
    [country, mobileLocal]
  );

  const onSubmit = async () => {
    const local = digitsOnly(mobileLocal);
    if (!local) return Alert.alert('تنبيه', 'يرجى إدخال رقم الجوال');
    if (!password) return Alert.alert('تنبيه', 'يرجى إدخال كلمة المرور');

    setBusy(true);
    try {
      console.log('[SignUp] start', { mobileE164: fullMobile, email: email?.trim()?.length ? 'provided' : 'none' });

      // 1) Create account
      await signUp(fullMobile, password, email.trim() || undefined);

      // 2) Telegram link status
      const st = await api.telegramStatus(fullMobile);
      console.log('[SignUp] telegram-status', st);

      if (!st.linked) {
        const { payload } = await api.telegramCreateLink(fullMobile);
        const url = `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(payload)}`;
        await Linking.openURL(url);
        Alert.alert('معلومة', 'افتح تيليجرام واضغط بدء لربط الحساب. يمكنك العودة للتحقق بإدخال الرمز.');
      }

      navigation.navigate('OtpVerify', { mobile: fullMobile });
    } catch (e: any) {
      console.warn('[SignUp] error', e?.message);
      Alert.alert('خطأ', e?.response?.data?.error || e?.message || 'تعذر إنشاء الحساب');
    } finally {
      setBusy(false);
    }
  };

  const renderCountryRow = ({ item }: { item: typeof ARAB_COUNTRIES[number] }) => (
    <Pressable
      onPress={() => { setCountry(item); setPickerOpen(false); }}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <FlagIcon iso={item.iso} size={18} />
        <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 14 }}>
          {item.nameAr}
        </Text>
      </View>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: '#0f4f30' }}>
        +{item.dial}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 16 }}>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 10, textAlign: 'center', marginVertical: 12, color: '#0f4f30' }}>
        في حال كنت متدرباً سابقاً يُفضَّل أن تسجّل بنفس رقم هاتفك المسجل لدى تنامي ترين
      </Text>

      {/* Phone row: country picker + national number */}
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          style={{
            backgroundColor: '#eceadf',
            borderRadius: 10,
            paddingVertical: 12,
            paddingHorizontal: 12,
            minWidth: 110,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
            flexDirection: 'row',       // ⬅ show icon + dial nicely
            gap: 6,                      // RN 0.71+: if not supported, use margin
          }}
        >
          <FlagIcon iso={country.iso} size={18} />
          <Text style={{ fontFamily: 'NotoKufiArabic-Bold', color: '#0f4f30' }}>
            +{country.dial}
          </Text>
        </TouchableOpacity>

        <TextInput
          placeholder="رقم الجوال (بدون مفتاح)"
          keyboardType="phone-pad"
          value={mobileLocal}
          onChangeText={(t) => setMobileLocal(stripLeadingZero(digitsOnly(t)))}
          style={{
            flex: 1,
            backgroundColor: '#eceadf',
            borderRadius: 10,
            padding: 12,
            textAlign: 'right',
            color: '#0f4f30',
            fontWeight: 'bold',
          }}
        />
      </View>

      <TextInput
        placeholder="البريد الإلكتروني (اختياري)"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'right', color: '#0f4f30', fontWeight: 'bold' }}
      />

      <TextInput
        placeholder="كلمة المرور"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ backgroundColor: '#eceadf', borderRadius: 10, padding: 12, marginBottom: 16, textAlign: 'right', color: '#0f4f30', fontWeight: 'bold' }}
      />

      <TouchableOpacity
        onPress={onSubmit}
        style={{ backgroundColor: '#0f4f30', borderRadius: 10, padding: 14, alignItems: 'center' }}
        disabled={busy}
      >
        {busy ? <ActivityIndicator color="#eceadf" /> : <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>إنشاء</Text>}
      </TouchableOpacity>

      {/* Country picker modal */}
      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setPickerOpen(false)}>
          <View style={{ marginTop: 'auto', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' }}>
            <View style={{ padding: 14, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, textAlign: 'center' }}>اختر مفتاح الدولة</Text>
            </View>
            <FlatList
              data={ARAB_COUNTRIES}
              keyExtractor={(it) => it.iso}
              renderItem={renderCountryRow}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f0f0f0' }} />}
              contentContainerStyle={{ paddingHorizontal: 6, paddingVertical: 8 }}
              style={{ direction: I18nManager.isRTL ? 'rtl' as any : 'ltr' as any }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default SignUpScreen;
