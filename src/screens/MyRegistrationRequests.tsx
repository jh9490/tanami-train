// src/screens/MyRegistrationRequests.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AppLoading from './components/AppLoading';
import ThemedBackground from './components/ThemedBackground';
import { colors } from '../theme/colors';
import type { RegistrationRequestItem as ReqItem } from '../types/api';
import { normalizeActivityType } from '../util/activityPricing';
import { resolveMediaUrl } from '../util/mediaUrl';
import PlaceholderPoster from './components/PlaceholderPoster';

const POSTER_WIDTH = 104;
const POSTER_HEIGHT = 118;

const containsArabic = (value: string): boolean =>
  /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(value);

function StatusBadge({ status }: { status: ReqItem['status'] }) {
  const map: Record<number, { text: string; bg: string; fg: string }> = {
    0: { text: 'قيد المراجعة', bg: '#fff4e6', fg: '#d9480f' },
    1: { text: 'مقبول', bg: '#e6fcf5', fg: '#2b8a3e' },
    2: { text: 'مرفوض', bg: '#ffe3e3', fg: '#c92a2a' },
  };
  const badge = map[status] || map[0];
  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
      <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.text}</Text>
    </View>
  );
}

function ModeBadge({ online }: { online: 0 | 1 }) {
  return (
    <View style={[styles.badge, { backgroundColor: online ? '#e7f5ff' : '#f1f3f5' }]}>
      <Text style={[styles.badgeText, { color: online ? '#1c7ed6' : '#495057' }]}>
        {online ? 'أونلاين' : 'حضوري'}
      </Text>
    </View>
  );
}

function TypeBadge({ initiative }: { initiative: boolean }) {
  return (
    <View style={[styles.badge, styles.typeBadge]}>
      <Text style={[styles.badgeText, styles.typeBadgeText]}>
        {initiative ? 'مبادرة' : 'دورة'}
      </Text>
    </View>
  );
}

export default function MyRegistrationRequests() {
  const { token, isAuthenticated } = useAuth();
  const [registrationRequests, setRegistrationRequests] = useState<ReqItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const items = useMemo(
    () => registrationRequests.filter(item => item.status === 0),
    [registrationRequests],
  );

  const loadRegistrationRequests = useCallback(async () => {
    if (!token) {
      setRegistrationRequests([]);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const response = await api.myRegistrations(token);
      const requests = response.items ?? [];
      const requestsWithPosters = await Promise.all(
        requests.map(async item => {
          const existingImage =
            item.image_url ?? item.activity?.image_url ?? item.course?.image_url;
          if (existingImage) return item;

          try {
            const detailResponse = await api.getActivity(item.activity_id, token);
            const activity =
              detailResponse?.activity ??
              detailResponse?.item ??
              detailResponse?.data ??
              detailResponse?.result ??
              detailResponse;

            return {
              ...item,
              image_url: activity?.image_url ?? null,
              activity_type: item.activity_type ?? activity?.activity_type ?? null,
              course: {
                ...activity?.course,
                ...item.course,
              },
            };
          } catch {
            return item;
          }
        }),
      );
      setRegistrationRequests(requestsWithPosters);
    } catch {
      setLoadError('تعذر تحميل طلبات التسجيل. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadRegistrationRequests();
    }, [loadRegistrationRequests]),
  );

  const formatDate = (s?: string | null, withTime = false) => {
    if (!s) return '—';
    try {
      const d = new Date(s.replace(' ', 'T'));
      return withTime
        ? d.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
        : d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
    } catch {
      return s;
    }
  };
  

  if (!isAuthenticated) {
    return (
      <ThemedBackground style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ color: colors.cream, fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, textAlign: 'center' }}>
          الرجاء تسجيل الدخول لعرض طلبات التسجيل الخاصة بك
        </Text>
      </ThemedBackground>
    );
  }

  if (loading && items.length === 0) {
    return (
      <ThemedBackground>
        <AppLoading style={{ backgroundColor: 'transparent' }} />
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRegistrationRequests} tintColor={colors.gold} colors={[colors.gold]} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: 'rgba(255, 248, 239, 0.72)', fontFamily: 'NotoKufiArabic-Regular', marginTop: 12 }}>
            {loadError ?? 'لا توجد طلبات بعد'}
          </Text>
        }
        renderItem={({ item }) => {
          const title = item.course?.name_ar || item.course?.name_en || `نشاط #${item.activity_id}`;
          const activityType =
            item.activity_type ??
            item.activity?.activity_type ??
            item.course?.activity_type;
          const isInitiative = normalizeActivityType(activityType) === 'initiative';
          const imageUrl = resolveMediaUrl(
            item.image_url ?? item.activity?.image_url ?? item.course?.image_url,
          );
          const titleIsArabic = containsArabic(title);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardTitle,
                    titleIsArabic ? styles.arabicTitle : styles.latinTitle,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  {title}
                </Text>
                <View style={styles.typeSlot}>
                  <TypeBadge initiative={isInitiative} />
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.poster}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.posterImage} resizeMode="cover" />
                  ) : (
                    <PlaceholderPoster width={POSTER_WIDTH} height={POSTER_HEIGHT} />
                  )}
                </View>
                <View style={styles.details}>
                  <View style={styles.fieldsGrid}>
                    <View style={styles.fieldRow}>
                      <Field label="معرّف النشاط" value={item.activity_id} />
                      <Field label="تاريخ الطلب" value={formatDate(item.created_at)} />
                    </View>
                    <View style={styles.fieldRow}>
                      <Field label="بداية النشاط" value={formatDate(item.activity_date)} />
                      <Field label="ينتهي في" value={formatDate(item.activity_end_date)} />
                    </View>
                    {isInitiative && typeof item.certificate_requested === 'boolean' && (
                      <View style={styles.certificateRow}>
                        <Field
                          label="طلب الشهادة"
                          value={item.certificate_requested ? 'تم طلب شهادة' : 'لم يتم طلب شهادة'}
                          fullWidth
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.headerBadges}>
                    <StatusBadge status={item.status} />
                    <ModeBadge online={item.online} />
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </ThemedBackground>
  );
}

function Field({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value?: string | number | null;
  fullWidth?: boolean;
}) {
  const displayValue = value === 0 || value ? String(value) : '—';
  const directionalValue = containsArabic(displayValue)
    ? displayValue
    : `\u2066${displayValue}\u2069`;

  return (
    <View style={[styles.fieldCell, fullWidth && styles.fullWidthField]}>
      <Text style={styles.fieldText}>
        {`${label}: `}
        <Text style={styles.inlineFieldValue}>{directionalValue}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 12,
    direction: 'rtl',
  },
  card: {
    width: '100%',
    direction: 'rtl',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e6e2d8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    flex: 1,
    color: '#151515',
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 13,
    lineHeight: 21,
    paddingHorizontal: 3,
    textAlign: 'center',
  },
  arabicTitle: {
    writingDirection: 'rtl',
    direction: 'rtl',
  },
  latinTitle: {
    writingDirection: 'ltr',
    direction: 'ltr',
  },
  divider: {
    height: 1,
    backgroundColor: '#e6e2d8',
    marginVertical: 8,
  },
  cardHeader: {
    direction: 'rtl',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 6,
  },
  typeSlot: {
    width: 54,
    alignItems: 'flex-start',
  },
  headerBadges: {
    width: '100%',
    direction: 'rtl',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 4,
    marginTop: 8,
  },
  cardBody: {
    direction: 'rtl',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f4f30',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  details: {
    flex: 1,
    direction: 'rtl',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 9,
  },
  typeBadge: {
    backgroundColor: '#eef3ef',
    borderWidth: 1,
    borderColor: '#d7e1da',
  },
  typeBadgeText: {
    color: '#0f4f30',
  },
  fieldsGrid: {
    direction: 'rtl',
    flexDirection: 'column',
    width: '100%',
    gap: 6,
  },
  fieldRow: {
    direction: 'rtl',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  fieldCell: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 1,
    paddingVertical: 2,
    direction: 'rtl',
  },
  certificateRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 3,
  },
  fullWidthField: {
    flex: 0,
    width: '100%',
    justifyContent: 'flex-start',
  },
  fieldText: {
    alignSelf: 'flex-end',
    maxWidth: '100%',
    color: '#6b7280',
    fontFamily: 'NotoKufiArabic-Bold',
    fontSize: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
    direction: 'rtl',
  },
  inlineFieldValue: {
    color: '#151515',
    fontFamily: 'NotoKufiArabic-Bold',
  },
});
