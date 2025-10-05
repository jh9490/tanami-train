import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

type InboxItem = {
  id: number | string;
  title?: string | null;
  body?: string | null;
  data?: Record<string, string>;
  delivered_via?: 'token'|'profile'|'topic'|null;
  received_at: string;
  opened_at?: string | null;
  notification_id?: number | string | null;
  fcm_message_id?: string | null;
};

const LIMIT = 20;

export default function MyNotificationsScreen({ navigation }: any) {
  const { profile, isAuthenticated } = useAuth();
  const profileId = useMemo(() => profile?.id ?? null, [profile?.id]);

  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<InboxItem | null>(null);

  // 🔒 stable refs to avoid useCallback deps
  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async (reset = true) => {
    if (!isAuthenticated || !profileId) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (inFlightRef.current) return; // avoid overlapping
    inFlightRef.current = true;

    try {
      if (reset) {
        setLoading(true);
        setError(null);
        offsetRef.current = 0;
      }

      const offset = reset ? 0 : offsetRef.current;
      const res = await api.inboxList(profileId, LIMIT, offset);
      console.log('[Inbox] ←', res);

      const ok = res && (res.ok === true || Array.isArray(res.items));
      if (!ok) {
        if (!mountedRef.current) return;
        setError(`فشل التحميل (${res?.status || res?.error || 'unknown'})`);
        if (reset) setItems([]);
        return;
      }

      const newItems: InboxItem[] = (res.items || []).map((it: any) => ({
        ...it, id: String(it.id),
      }));

      if (!mountedRef.current) return;
      setItems(prev => (reset ? newItems : [...prev, ...newItems]));
      offsetRef.current = offset + newItems.length;
    } catch (e: any) {
      if (!mountedRef.current) return;
      console.log('[Inbox] load error', e?.message || e);
      setError('تعذر الاتصال بالخادم.');
      if (reset) setItems([]);
    } finally {
      inFlightRef.current = false;
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, profileId]); // ✅ stable deps only

  // Load once per auth/profile change
  useEffect(() => {
    load(true);
    // ⚠️ Intentionally NOT depending on `load` (it’s stable) to avoid re-run loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, profileId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
  }, [load]);

  const onEndReached = useCallback(async () => {
    if (loading || refreshing) return;
    if (items.length < LIMIT) return; // nothing more to fetch (simple guard)
    await load(false);
  }, [loading, refreshing, items.length, load]);

  const onPressItem = useCallback(async (item: InboxItem) => {
    setSelected(item);
    if (!item.opened_at && profileId) {
      try { await api.inboxOpen(profileId, Number(item.id)); } catch {}
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, opened_at: new Date().toISOString() } : it));
    }
    const d = (item as any).data || {};
    if (d.screen === 'CourseTabs' && d.activityId) {
      navigation.navigate('CourseTabs', { activityId: Number(d.activityId) });
    }
  }, [profileId, navigation]);

  if (!isAuthenticated) {
    return (
      <View style={s.container}>
        <Text style={s.msg}>سجّل الدخول لعرض إشعاراتك.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 12 }}>
      <View style={s.card}>
        {loading ? (
          <ActivityIndicator color="#0f4f30" />
        ) : error ? (
          <View style={{ padding: 16 }}>
            <Text style={s.err}>{error}</Text>
            <TouchableOpacity onPress={() => load(true)} style={s.retryBtn}>
              <Text style={s.retryTxt}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onPressItem(item)} style={s.row} activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>
                    {!item.opened_at ? '• ' : ''}{item.title || 'Tanami Train'}
                  </Text>
                  {!!item.body && <Text style={s.preview} numberOfLines={1}>{item.body}</Text>}
                </View>
                <Text style={s.date}>{(item.received_at || '').slice(0, 16)}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f4f30" />}
            onEndReachedThreshold={0.35}
            onEndReached={onEndReached}
            ListEmptyComponent={<Text style={s.empty}>لا إشعارات بعد.</Text>}
          />
        )}
      </View>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{selected?.title || 'Tanami Train'}</Text>
            {!!selected?.body && <Text style={s.modalBody}>{selected?.body}</Text>}
            <TouchableOpacity onPress={() => setSelected(null)} style={s.modalBtn}>
              <Text style={s.modalBtnText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#fff1e2' },
  msg:{ fontFamily:'NotoKufiArabic-Regular', color:'#333' },
  card: { backgroundColor: '#eceadf', borderRadius: 14, padding: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 },
  title: { fontFamily: 'NotoKufiArabic-Bold', color: '#111', fontSize: 14 },
  preview: { fontFamily: 'NotoKufiArabic-Regular', color: '#555', fontSize: 12, marginTop: 4 },
  date: { fontFamily: 'NotoKufiArabic-Regular', color: '#888', fontSize: 11, marginHorizontal: 6 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#eee' },
  empty: { textAlign: 'center', marginTop: 20, fontFamily:'NotoKufiArabic-Regular', color:'#555' },
  err: { textAlign:'center', fontFamily:'NotoKufiArabic-Regular', color:'#a00' },
  retryBtn: { marginTop: 12, alignSelf:'center', backgroundColor:'#0f4f30', paddingHorizontal:16, paddingVertical:10, borderRadius:10 },
  retryTxt: { color:'#eceadf', fontFamily:'NotoKufiArabic-Bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: '#eceadf', borderRadius: 14, padding: 16, width: '86%' },
  modalTitle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, color: '#111', textAlign: 'center' },
  modalBody: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 14, color: '#333', marginTop: 8, textAlign: 'right', lineHeight: 22 },
  modalBtn: { marginTop: 16, backgroundColor: '#0f4f30', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  modalBtnText: { color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold', fontSize: 14 },
});
