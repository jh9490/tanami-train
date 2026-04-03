// src/screens/auth/SignInScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { digitsOnly, stripLeadingZero, buildE164 } from '../../util/phone';
import FlagIcon from '../../util/FlagIcon';

/* --- Arabic countries (dial codes without the leading '+') --- */
type Country = { code: string; name: string; dial: string };

const AR_COUNTRIES: Country[] = [
  { code: 'SY', name: 'سوريا',     dial: '963' },
  { code: 'SA', name: 'السعودية',  dial: '966' },
  { code: 'AE', name: 'الإمارات',  dial: '971' },
  { code: 'JO', name: 'الأردن',    dial: '962' },
  { code: 'LB', name: 'لبنان',     dial: '961' },
  { code: 'EG', name: 'مصر',       dial: '20'  },
  { code: 'IQ', name: 'العراق',    dial: '964' },
  { code: 'KW', name: 'الكويت',    dial: '965' },
  { code: 'QA', name: 'قطر',       dial: '974' },
  { code: 'OM', name: 'عُمان',     dial: '968' },
  { code: 'BH', name: 'البحرين',   dial: '973' },
  { code: 'YE', name: 'اليمن',     dial: '967' },
  { code: 'PS', name: 'فلسطين',    dial: '970' },
  { code: 'MA', name: 'المغرب',    dial: '212' },
  { code: 'DZ', name: 'الجزائر',   dial: '213' },
  { code: 'TN', name: 'تونس',      dial: '216' },
  { code: 'LY', name: 'ليبيا',     dial: '218' },
  { code: 'SD', name: 'السودان',   dial: '249' },
];

/* --- Small inline modal picker (uses FlagIcon) --- */
function CountryCodePicker({
  value,
  onSelect,
}: {
  value: Country;
  onSelect: (c: Country) => void;
}) {
  const [open, setOpen] = useState(false);
  const sorted = useMemo(
    () => [...AR_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'ar')),
    []
  );

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          backgroundColor: '#eceadf',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          minWidth: 120,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <FlagIcon iso={value.code} size={18} />
        <Text style={{ fontFamily: 'NotoKufiArabic-Bold', color: '#0f4f30' }}>
          +{value.dial}
        </Text>
        <Text style={{ color: '#0f4f30', marginLeft: 4 }}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        <View
          style={{
            maxHeight: '70%',
            backgroundColor: '#fff',
            padding: 12,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontFamily: 'NotoKufiArabic-Bold',
              color: '#0f4f30',
              marginBottom: 8,
              fontSize: 16,
            }}
          >
            اختر مفتاح الدولة
          </Text>

          <FlatList
            data={sorted}
            keyExtractor={(item) => item.code}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor:
                    item.code === value.code ? '#e6f2ed' : '#f6f5f0',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FlagIcon iso={item.code} size={18} />
                    <Text
                      style={{
                        fontFamily: 'NotoKufiArabic-Regular',
                        color: '#0f4f30',
                        marginLeft: 8,
                      }}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: 'NotoKufiArabic-Bold',
                      color: '#0f4f30',
                    }}
                  >
                    +{item.dial}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            onPress={() => setOpen(false)}
            style={{
              marginTop: 10,
              alignSelf: 'center',
              paddingVertical: 10,
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                color: '#0f4f30',
                fontFamily: 'NotoKufiArabic-Regular',
              }}
            >
              إغلاق
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const SignInScreen: React.FC<any> = ({ navigation }) => {
  const { signIn } = useAuth();

  // Default to Syria (963) — change if needed
  const [country, setCountry] = useState<Country>(() => AR_COUNTRIES.find(c => c.code === 'SY') || AR_COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Build E.164 (+<dial><national>) while dropping a single leading 0
  const mobileFull = useMemo(
    () => buildE164(country.dial, localNumber),
    [country, localNumber]
  );

  const onSubmit = async () => {
    if (busy) return;

    if (!digitsOnly(localNumber)) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الجوال');
      return;
    }
    if (!password) {
      Alert.alert('تنبيه', 'يرجى إدخال كلمة المرور');
      return;
    }

    setBusy(true);
    try {
      await signIn(mobileFull, password); // must match your SignUp format
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 16 }}>
      {/* Phone row: picker + number input */}
      <View style={{ flexDirection: 'row-reverse', gap: 8, marginBottom: 10 }}>
        <View style={{ flex: 0 }}>
          <CountryCodePicker value={country} onSelect={setCountry} />
        </View>

        <TextInput
          placeholder="رقم الجوال (بدون صفر البداية)"
          keyboardType="phone-pad"
          value={localNumber}
          onChangeText={(t) => setLocalNumber(stripLeadingZero(digitsOnly(t)))}
          style={{
            flex: 1,
            backgroundColor: '#eceadf',
            borderRadius: 10,
            padding: 12,
            textAlign: 'right',
            color: '#0f4f30',
          }}
        />
      </View>

      <TextInput
        placeholder="كلمة المرور"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          backgroundColor: '#eceadf',
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
          textAlign: 'right',
          color: '#0f4f30',
        }}
      />

      <TouchableOpacity
        onPress={onSubmit}
        style={{ backgroundColor: '#0f4f30', borderRadius: 10, padding: 14, alignItems: 'center' }}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#eceadf" />
        ) : (
          <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' }}>دخول</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 16, alignSelf: 'center' }}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={{ color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular' }}>
          ليس لديك حساب؟ أنشئ حسابًا الآن
        </Text>
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
