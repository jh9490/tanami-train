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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { isNotVerifiedError } from '../../auth/otp';
import { authColors, authStyles } from '../../auth/ui';
import { useAuth } from '../../context/AuthContext';
import { digitsOnly, stripLeadingZero, buildE164 } from '../../util/phone';
import FlagIcon from '../../util/FlagIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedBackground from '../components/ThemedBackground';

type Country = { code: string; name: string; dial: string };

const AR_COUNTRIES: Country[] = [
  { code: 'SY', name: 'سوريا', dial: '963' },
  { code: 'SA', name: 'السعودية', dial: '966' },
  { code: 'AE', name: 'الإمارات', dial: '971' },
  { code: 'JO', name: 'الأردن', dial: '962' },
  { code: 'LB', name: 'لبنان', dial: '961' },
  { code: 'EG', name: 'مصر', dial: '20' },
  { code: 'IQ', name: 'العراق', dial: '964' },
  { code: 'KW', name: 'الكويت', dial: '965' },
  { code: 'QA', name: 'قطر', dial: '974' },
  { code: 'OM', name: 'عُمان', dial: '968' },
  { code: 'BH', name: 'البحرين', dial: '973' },
  { code: 'YE', name: 'اليمن', dial: '967' },
  { code: 'PS', name: 'فلسطين', dial: '970' },
  { code: 'MA', name: 'المغرب', dial: '212' },
  { code: 'DZ', name: 'الجزائر', dial: '213' },
  { code: 'TN', name: 'تونس', dial: '216' },
  { code: 'LY', name: 'ليبيا', dial: '218' },
  { code: 'SD', name: 'السودان', dial: '249' },
];

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
          backgroundColor: authColors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: authColors.cardBorder,
          paddingHorizontal: 12,
          paddingVertical: 14,
          minWidth: 124,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Text style={{ color: authColors.hint, marginRight: 2 }}>▾</Text>
        <Text style={{ fontFamily: 'NotoKufiArabic-Bold', color: authColors.text }}>
          +{value.dial}
        </Text>
        <FlagIcon iso={value.code} size={18} />
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
            backgroundColor: authColors.white,
            padding: 12,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontFamily: 'NotoKufiArabic-Bold',
              color: authColors.text,
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
                  borderRadius: 12,
                  backgroundColor:
                    item.code === value.code ? authColors.primarySoft : '#f6f5f0',
                }}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                    <FlagIcon iso={item.code} size={18} />
                    <Text
                      style={{
                        fontFamily: 'NotoKufiArabic-Regular',
                        color: authColors.text,
                        marginRight: 8,
                      }}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: 'NotoKufiArabic-Bold',
                      color: authColors.text,
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
            style={{ marginTop: 10, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16 }}
          >
            <Text style={{ color: authColors.text, fontFamily: 'NotoKufiArabic-Regular' }}>
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
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState<Country>(() => AR_COUNTRIES.find(c => c.code === 'SY') || AR_COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

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
      await signIn(mobileFull, password);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e: any) {
      if (isNotVerifiedError(e?.message)) {
        navigation.navigate('OtpVerify', {
          mobile: mobileFull,
          context: 'signin',
          deliveryMethod: 'whatsapp',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedBackground>
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
            <Text style={authStyles.pillText}>الدخول إلى الحساب</Text>
          </View>
          <Text style={authStyles.title}>أهلاً بعودتك</Text>
          <Text style={authStyles.subtitle}>
            سجّل الدخول برقم الجوال وكلمة المرور للوصول إلى دوراتك وملفك التدريبي.
          </Text>
        </View>

        <View style={authStyles.card}>
          <Text style={authStyles.sectionTitle}>رقم الجوال</Text>
          <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
            <View style={{ flex: 0 }}>
              <CountryCodePicker value={country} onSelect={setCountry} />
            </View>

            <TextInput
              placeholder="رقم الجوال بدون صفر البداية"
              keyboardType="phone-pad"
              value={localNumber}
              onChangeText={(t) => setLocalNumber(stripLeadingZero(digitsOnly(t)))}
              style={[authStyles.field, { flex: 1 }]}
            />
          </View>

          <Text style={authStyles.sectionTitle}>كلمة المرور</Text>
          <TextInput
            placeholder="اكتب كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={authStyles.field}
          />

          <TouchableOpacity
            onPress={onSubmit}
            style={authStyles.primaryButton}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={authColors.white} />
            ) : (
              <Text style={authStyles.primaryButtonText}>دخول</Text>
            )}
          </TouchableOpacity>

          <Text style={authStyles.centerText}>
            إذا كان الحساب غير مفعّل بعد، سيتم نقلك تلقائياً إلى شاشة التحقق.
          </Text>
        </View>

        <TouchableOpacity
          style={authStyles.actionLink}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={authStyles.actionLinkText}>ليس لديك حساب؟ أنشئ حساباً جديداً</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={authStyles.actionLink}
          onPress={() => navigation.navigate('ResetPassword')}
        >
          <Text style={authStyles.subtleLinkText}>نسيت كلمة المرور؟</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </ThemedBackground>
  );
};

export default SignInScreen;
