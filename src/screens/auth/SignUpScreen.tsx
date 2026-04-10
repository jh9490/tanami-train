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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  mapAuthError,
  OtpDeliveryMethod,
  OTP_DELIVERY_OPTIONS,
} from '../../auth/otp';
import { authColors, authStyles } from '../../auth/ui';
import { api } from '../../services/api';
import { buildE164, digitsOnly, stripLeadingZero } from '../../util/phone';
import FlagIcon from '../../util/FlagIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BOT_USERNAME = 'TanamiTrain_bot';

const ARAB_COUNTRIES = [
  { nameAr: 'السعودية', iso: 'SA', dial: '966' },
  { nameAr: 'الإمارات', iso: 'AE', dial: '971' },
  { nameAr: 'قطر', iso: 'QA', dial: '974' },
  { nameAr: 'الكويت', iso: 'KW', dial: '965' },
  { nameAr: 'البحرين', iso: 'BH', dial: '973' },
  { nameAr: 'عُمان', iso: 'OM', dial: '968' },
  { nameAr: 'الأردن', iso: 'JO', dial: '962' },
  { nameAr: 'لبنان', iso: 'LB', dial: '961' },
  { nameAr: 'سوريا', iso: 'SY', dial: '963' },
  { nameAr: 'العراق', iso: 'IQ', dial: '964' },
  { nameAr: 'مصر', iso: 'EG', dial: '20' },
  { nameAr: 'اليمن', iso: 'YE', dial: '967' },
  { nameAr: 'فلسطين', iso: 'PS', dial: '970' },
  { nameAr: 'السودان', iso: 'SD', dial: '249' },
  { nameAr: 'الجزائر', iso: 'DZ', dial: '213' },
  { nameAr: 'المغرب', iso: 'MA', dial: '212' },
  { nameAr: 'تونس', iso: 'TN', dial: '216' },
  { nameAr: 'ليبيا', iso: 'LY', dial: '218' },
  { nameAr: 'موريتانيا', iso: 'MR', dial: '222' },
  { nameAr: 'الصومال', iso: 'SO', dial: '252' },
  { nameAr: 'جيبوتي', iso: 'DJ', dial: '253' },
  { nameAr: 'جزر القمر', iso: 'KM', dial: '269' },
];

const SignUpScreen: React.FC<any> = ({ navigation }) => {
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [country, setCountry] = useState(() => ARAB_COUNTRIES.find(c => c.iso === 'SY') || ARAB_COUNTRIES[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobileLocal, setMobileLocal] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<OtpDeliveryMethod>('telegram');

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
      await signUp(fullMobile, password, email.trim() || undefined, deliveryMethod);

      if (deliveryMethod === 'sms') {
        try {
          await api.sendOtp(fullMobile, 'initial', 'sms');
        } catch (sendError: any) {
          Alert.alert('خطأ', mapAuthError(sendError?.message));
        }
      }

      if (deliveryMethod === 'telegram') {
        try {
          const st = await api.telegramStatus(fullMobile);
          if (!st.linked) {
            const { payload } = await api.telegramCreateLink(fullMobile);
            const url = `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(payload)}`;
            await Linking.openURL(url);
            Alert.alert('معلومة', 'افتح تيليجرام واضغط على بدء لإكمال ربط الحساب ثم عد إلى شاشة التحقق.');
          }
        } catch (e: any) {
          Alert.alert('خطأ', mapAuthError(e?.response?.data?.error || e?.message));
          return;
        }
      }

      navigation.navigate('OtpVerify', {
        mobile: fullMobile,
        context: 'signup',
        deliveryMethod,
      });
    } catch (e: any) {
      Alert.alert('خطأ', mapAuthError(e?.message));
      console.warn('[SignUp] error', e?.message);
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
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
        <FlagIcon iso={item.iso} size={18} />
        <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 14 }}>
          {item.nameAr}
        </Text>
      </View>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: authColors.primary }}>
        +{item.dial}
      </Text>
    </Pressable>
  );

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
            <Text style={authStyles.pillText}>إنشاء حساب جديد</Text>
          </View>
          <Text style={authStyles.title}>ابدأ رحلتك مع تنامي ترين</Text>
          <Text style={authStyles.subtitle}>
            إذا كنت متدرباً سابقاً، يفضّل التسجيل بنفس رقم الجوال المسجل لديك حتى تظهر بياناتك بشكل صحيح.
          </Text>
        </View>

        <View style={authStyles.card}>
          <Text style={authStyles.sectionTitle}>رقم الجوال</Text>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              style={{
                backgroundColor: authColors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: authColors.cardBorder,
                paddingVertical: 14,
                paddingHorizontal: 12,
                minWidth: 120,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row-reverse',
                gap: 6,
              }}
            >
              <FlagIcon iso={country.iso} size={18} />
              <Text style={{ fontFamily: 'NotoKufiArabic-Bold', color: authColors.primary }}>
                +{country.dial}
              </Text>
            </TouchableOpacity>

            <TextInput
              placeholder="رقم الجوال بدون مفتاح الدولة"
              keyboardType="phone-pad"
              value={mobileLocal}
              onChangeText={(t) => setMobileLocal(stripLeadingZero(digitsOnly(t)))}
              style={[authStyles.field, { flex: 1 }]}
            />
          </View>

          <Text style={authStyles.sectionTitle}>البريد الإلكتروني</Text>
          <TextInput
            placeholder="البريد الإلكتروني اختياري"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={authStyles.field}
          />

          <Text style={authStyles.sectionTitle}>كلمة المرور</Text>
          <TextInput
            placeholder="اكتب كلمة المرور"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={authStyles.field}
          />

          <Text style={authStyles.sectionTitle}>طريقة استلام الرمز</Text>
          <Text style={authStyles.sectionHint}>
            اختر الطريقة المناسبة لك لإرسال رمز التحقق عند إنشاء الحساب.
          </Text>
          <View style={{ gap: 8 }}>
            {OTP_DELIVERY_OPTIONS.map(option => {
              const selected = deliveryMethod === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setDeliveryMethod(option.key)}
                  style={[
                    authStyles.optionCard,
                    {
                      backgroundColor: selected ? authColors.primarySoft : authColors.surface,
                      borderColor: selected ? authColors.primary : authColors.cardBorder,
                    },
                  ]}
                >
                  <Text style={authStyles.optionTitle}>{option.title}</Text>
                  <Text style={authStyles.optionDescription}>{option.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={onSubmit}
            style={authStyles.primaryButton}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={authColors.white} />
            ) : (
              <Text style={authStyles.primaryButtonText}>إنشاء الحساب</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={authStyles.actionLink}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={authStyles.actionLinkText}>لديك حساب بالفعل؟ سجل الدخول</Text>
        </TouchableOpacity>

        <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={() => setPickerOpen(false)}>
            <View style={{ marginTop: 'auto', backgroundColor: authColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
              <View style={{ padding: 14, borderBottomWidth: 1, borderColor: '#eee' }}>
                <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, textAlign: 'center' }}>اختر مفتاح الدولة</Text>
              </View>
              <FlatList
                data={ARAB_COUNTRIES}
                keyExtractor={(it) => it.iso}
                renderItem={renderCountryRow}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f0f0f0' }} />}
                contentContainerStyle={{ paddingHorizontal: 6, paddingVertical: 8 }}
              />
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;
