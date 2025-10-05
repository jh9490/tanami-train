// src/screens/MenuScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { Linking } from 'react-native';
type Nav = NativeStackNavigationProp<RootStackParamList>;

const Row = ({
  title,
  icon,
  onPress,
  danger = false,
}: {
  title: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
    <Icon
      name={icon}
      size={22}
      color={danger ? '#d9534f' : '#0f4f30'}
      style={{ transform: I18nManager.isRTL ? [{ scaleX: -1 }] : undefined }}
    />
    <Text style={[styles.rowText, danger && styles.rowTextDanger]}>{title}</Text>
    <Icon
      name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'}
      size={22}
      color={danger ? '#d9534f' : '#999'}
      style={{ marginLeft: 'auto' }}
    />
  </TouchableOpacity>
);

export default function MenuScreen() {
  const navigation = useNavigation<Nav>();
  const { signOut, user, isAuthenticated } = useAuth();

  const handleLogout = () => {
    Alert.alert('تأكيد', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            navigation.navigate('MainTabs');
          } catch {
            // ignore
          }
        },
      },
    ]);
  };

  const openMap = async () => {
    const url = 'https://maps.app.goo.gl/sLtZczjuXT6cuSZ88?g_st=ac';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('خطأ', 'لا يمكن فتح تطبيق الخرائط على هذا الجهاز');
    }
  };

  return (
    <View style={styles.container}>
      {/* بطاقة بسيطة لبيانات المستخدم */}
      <View style={styles.headerCard}>
        <Icon
          name="account-circle"
          size={48}
          color="#0f4f30"
          style={{ transform: I18nManager.isRTL ? [{ scaleX: -1 }] : undefined }}
        />
        <View style={{ marginHorizontal: 8, flex: 1 }}>
          <Text style={styles.headerTitle}>
            {isAuthenticated ? 'أهلًا بك' : 'مرحبًا'}
          </Text>
          <Text style={styles.headerSub}>
            {isAuthenticated ? (user?.username ?? '') : 'سجّل الدخول للوصول لكل الميزات'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Row
          title="التحقق من الشهادات"
          icon="verified"
          // @ts-expect-error: depends on your stack names
          onPress={() => navigation.navigate('VerifyCertificate')}
        />
        <Row
          title="اتصل بنا"
          icon="support-agent"
          // @ts-expect-error
          onPress={() => navigation.navigate('ContactUs')}
        />

       <Row title="موقعنا" icon="place" onPress={openMap} />

        {/* Divider */}
        <View style={styles.divider} />

        {isAuthenticated ? (
          <Row title="تسجيل الخروج" icon="logout" onPress={handleLogout} danger />
        ) : (
          <Row
            title="تسجيل الدخول"
            icon="login"
            onPress={() => navigation.navigate('AuthStack', { screen: 'SignIn' })}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff1e2', padding: 16 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eceadf',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 16,
    color: '#111',
    textAlign: 'right',
  },
  headerSub: {
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#eceadf',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    gap: 12,
  },
  rowText: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, color: '#111' },
  rowTextDanger: { color: '#d9534f' },
  divider: { height: 12, backgroundColor: 'transparent' },
});
