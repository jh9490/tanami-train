// src/screens/MyRegistrationRequests.tsx
import React, { useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AppLoading from './components/AppLoading';
import ThemedBackground from './components/ThemedBackground';
import { colors } from '../theme/colors';
import type { RegistrationRequestItem as ReqItem } from '../types/api';

export default function MyRegistrationRequests() {
  const {
    registrationRequests,
    isAuthenticated,
    bootstrapLoading,
    refreshBootstrap,
  } = useAuth();
  const items = useMemo(
    () => registrationRequests.filter(item => item.status === 0),
    [registrationRequests],
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
  

  const StatusBadge = ({ status }: { status: ReqItem['status'] }) => {
    const map: Record<number, { text: string; bg: string; fg: string }> = {
      0: { text: 'قيد المراجعة', bg: '#fff4e6', fg: '#d9480f' },
      1: { text: 'مقبول',       bg: '#e6fcf5', fg: '#2b8a3e' },
      2: { text: 'مرفوض',       bg: '#ffe3e3', fg: '#c92a2a' },
    };
    const m = map[status] || map[0];
    return (
      <View style={{ backgroundColor: m.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
        <Text style={{ color: m.fg, fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 }}>{m.text}</Text>
      </View>
    );
  };

  const ModeBadge = ({ online }: { online: 0 | 1 }) => {
    const text = online ? 'أونلاين' : 'حضوري';
    const bg   = online ? '#e7f5ff' : '#f1f3f5';
    const fg   = online ? '#1c7ed6' : '#495057';
    return (
      <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
        <Text style={{ color: fg, fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 }}>{text}</Text>
      </View>
    );
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

  if (bootstrapLoading && items.length === 0) {
    return (
      <ThemedBackground>
        <AppLoading style={{ backgroundColor: 'transparent' }} />
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground style={{ flex: 1, padding: 12 }}>
      <Text style={{ color: colors.cream, fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, textAlign: 'center', marginBottom: 10 }}>
        طلبات تسجيلي
      </Text>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        refreshControl={<RefreshControl refreshing={bootstrapLoading} onRefresh={() => refreshBootstrap().catch(() => undefined)} tintColor={colors.gold} colors={[colors.gold]} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: 'rgba(255, 248, 239, 0.72)', fontFamily: 'NotoKufiArabic-Regular', marginTop: 12 }}>
            لا توجد طلبات بعد
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: 'rgba(255, 248, 239, 0.12)',
              borderRadius: 14,
              padding: 12,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: 'rgba(255, 248, 239, 0.16)',
            }}
          >
            {/* top row: status + mode */}
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status={item.status} />
              <ModeBadge online={item.online} />
            </View>

                      {/* info */}
          <View style={{ marginTop: 10 }}>
            <Row label="الدورة" value={item.course?.name_ar || item.course?.name_en} />
            <Row label="النشاط" value={`#${item.activity_id}`} />
            {/* created_at with datetime */}
            <Row label="أنشئ" value={formatDate(item.created_at, true)} />
            {/* updated_at with datetime */}
            <Row label="آخر تحديث" value={formatDate(item.updated_at, true)} />
            {/* if you add other dates (like activity_date) -> date only */}
            {/* <Row label="تاريخ النشاط" value={formatDate(item.activity?.date)} /> */}
            <Row label="تاريخ البدء" value={formatDate(item.activity_date)} />
            <Row label="تاريخ الانتهاء" value={formatDate(item.activity_end_date)} />
          </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </ThemedBackground>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 4 }}>
      <Text style={{ width: 110, color: colors.cream, fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 }}>{label}</Text>
      <Text style={{ flex: 1, color: 'rgba(255, 248, 239, 0.78)', fontFamily: 'NotoKufiArabic-Regular', fontSize: 12 }}>
        {value === 0 || value ? String(value) : '—'}
      </Text>
    </View>
  );
}
