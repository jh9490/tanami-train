// src/screens/MenuScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager, Alert, Platform, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MenuStackParamList, RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { Linking } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedBackground from '../components/ThemedBackground';
import { colors } from '../../theme/colors';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<MenuStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

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
      name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'}
      size={22}
      color={danger ? '#d9534f' : 'rgba(255, 248, 239, 0.58)'}
    />
    <View style={styles.rowMain}>
      <Text style={[styles.rowText, danger && styles.rowTextDanger]}>{title}</Text>
      <Icon
        name={icon}
        size={22}
        color={danger ? '#d9534f' : colors.gold}
        style={{ transform: I18nManager.isRTL ? [{ scaleX: -1 }] : undefined }}
      />
    </View>
  </TouchableOpacity>
);

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { signOut, isAuthenticated, displayName } = useAuth();

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

  const lat = 24.4539;  // example
  const lng = 54.3773;  // example
  const label = 'Tanami HQ'; // optional
  const query = `${lat},${lng}`; // or 'Street, City'
  async function tryOpen(url: string) {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) { await Linking.openURL(url); return true; }
      return false;
    } catch { return false; }
  }
  
  const openMap = async () => {
    // Build candidates (no dynamic links)
    const candidates: string[] = [
      // 1) Open Google Maps app directly (iOS & Android)
      `comgooglemaps://?q=${encodeURIComponent(label || query)}`,
  
      // 2) Android geo: URI (most OEMs)
      Platform.OS === 'android'
        ? `geo:${lat},${lng}?q=${encodeURIComponent(label || query)}`
        : '',
  
      // 3) Official web URL (works everywhere)
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
  
      // 4) LAST RESORT: your original short link (avoid, but keep as fallback)
      `https://maps.app.goo.gl/sLtZczjuXT6cuSZ88`,
    ].filter(Boolean);
  
    for (const url of candidates) {
      if (await tryOpen(url)) return;
    }
  
    Alert.alert('خطأ', 'لا يمكن فتح الخريطة على هذا الجهاز.');
  };

  return (
    <ThemedBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* بطاقة بسيطة لبيانات المستخدم */}
        <View style={styles.headerCard}>
          <View style={styles.headerMain}>
            <Text style={styles.headerTitle}>
              {isAuthenticated ? 'أهلًا بك' : 'مرحبًا'}
            </Text>
            <Text style={styles.headerSub}>
              {isAuthenticated ? displayName: 'سجّل الدخول للوصول لكل الميزات'}
            </Text>
          </View>
          <Icon
            name="account-circle"
            size={48}
            color={colors.gold}
            style={{ transform: I18nManager.isRTL ? [{ scaleX: -1 }] : undefined }}
          />
        </View>

        <View style={styles.card}>
          <Row
            title="التحقق من الشهادات"
            icon="verified"
            onPress={() => navigation.navigate('VerifyCertificate')}
          />
          {isAuthenticated && (
            <Row
              title="طلبات التسجيل"
              icon="how-to-reg"
              onPress={() => navigation.navigate('UserStack', { screen: 'MyRegistrationRequests' })}
            />
          )}
          <Row
            title="اتصل بنا"
            icon="support-agent"
            onPress={() => navigation.navigate('ContactUs')}
          />

         <Row title="موقعنا" icon="place" onPress={openMap} />

          {/* Divider */}
          <View style={styles.divider} />

          {/* ✅ Show only for authenticated users */}
          {isAuthenticated && (
            <>
              <Row
                title="الإعدادات"
                icon="settings"
                onPress={() => navigation.navigate('Settings')}
              />
              <Row
                title="صـوري"
                icon="photo-library"
                onPress={() => navigation.navigate('MyPhotos')}
              />
            </>
          )}

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
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, direction: 'rtl' },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 248, 239, 0.12)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 239, 0.16)',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerMain: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 16,
    color: colors.cream,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  headerSub: {
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 12,
    color: 'rgba(255, 248, 239, 0.72)',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'rgba(255, 248, 239, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 239, 0.16)',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    ...rtlStyles.rowCenter,
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 248, 239, 0.16)',
    gap: 12,
  },
  rowMain: {
    ...rtlStyles.rowCenter,
    flex: 1,
    justifyContent: 'flex-start',
    gap: 12,
  },
  rowText: {
    flex: 1,
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 16,
    color: colors.cream,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  rowTextDanger: { color: '#d9534f' },
  divider: { height: 12, backgroundColor: 'transparent' },
});
