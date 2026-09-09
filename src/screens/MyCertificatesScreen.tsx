import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { HistoricalCertificateItem } from '../types/api';
import { colors } from '../theme/colors';
import AppLoading from './components/AppLoading';
import ThemedBackground from './components/ThemedBackground';

const courseName = (item: HistoricalCertificateItem) =>
  item.course?.name_ar ||
  item.activity?.course_name_ar ||
  item.course_name_ar ||
  item.course?.name_en ||
  item.activity?.course_name_en ||
  item.course_name_en ||
  'دورة تدريبية';

const certificateDate = (item: HistoricalCertificateItem) =>
  item.date || item.issues?.find(issue => issue.date)?.date || null;

const certificateSerial = (item: HistoricalCertificateItem) =>
  item.serial ||
  item.certificate_id ||
  item.issues?.find(issue => issue.serial || issue.certificate_id)?.serial ||
  item.issues?.find(issue => issue.certificate_id)?.certificate_id ||
  null;

export default function MyCertificatesScreen() {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState<HistoricalCertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (asRefresh = false) => {
    if (!token) {
      setLoading(false);
      return;
    }
    asRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await api.fetchCertificates(token);
      const certificates = response.items ?? response.certificates ?? [];
      setItems(Array.isArray(certificates) ? certificates : []);
    } catch (error: any) {
      Alert.alert('تعذّر تحميل الشهادات', error?.message || 'يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) load();
      else setLoading(false);
    }, [isAuthenticated, load]),
  );

  if (!isAuthenticated) {
    return (
      <ThemedBackground style={styles.center}>
        <Text style={styles.empty}>الرجاء تسجيل الدخول لعرض شهاداتك</Text>
      </ThemedBackground>
    );
  }

  if (loading) {
    return (
      <ThemedBackground>
        <AppLoading style={styles.loading} />
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item, index) => String(item.id ?? item.serial ?? index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        contentContainerStyle={items.length ? styles.list : styles.emptyList}
        ListEmptyComponent={<Text style={styles.empty}>لا توجد شهادات حتى الآن</Text>}
        renderItem={({ item }) => {
          const serial = certificateSerial(item);
          const issueCount = item.issues?.length ?? 0;
          return (
            <View style={styles.card}>
              <Text style={styles.title}>{courseName(item)}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.source === 'legacy_course' ? 'شهادة سابقة' : 'شهادة نشاط'}
                </Text>
              </View>
              <Row label="تاريخ الإصدار" value={certificateDate(item)} />
              <Row label="الرقم" value={serial} />
              <Row label="التقدير" value={item.grade} />
              {issueCount > 0 ? <Row label="الإصدارات" value={issueCount} /> : null}
            </View>
          );
        }}
      />
    </ThemedBackground>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { backgroundColor: 'transparent' },
  list: { padding: 12, paddingBottom: 28 },
  emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  empty: {
    color: 'rgba(255, 248, 239, 0.78)',
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 248, 239, 0.12)',
    borderColor: 'rgba(255, 248, 239, 0.16)',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  title: {
    color: colors.cream,
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 15,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(203, 174, 130, 0.2)',
    borderRadius: 999,
    marginVertical: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { color: colors.gold, fontFamily: 'NotoKufiArabic-Bold', fontSize: 10 },
  row: { flexDirection: 'row', paddingVertical: 3 },
  label: { color: colors.cream, fontFamily: 'NotoKufiArabic-Bold', fontSize: 11, width: 105 },
  value: { color: 'rgba(255, 248, 239, 0.78)', flex: 1, fontFamily: 'NotoKufiArabic-Regular', fontSize: 11 },
});
