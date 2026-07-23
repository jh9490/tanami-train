// src/screens/MyPhotosScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import styled from 'styled-components/native';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import AppLoading from './components/AppLoading';
import ThemedBackground from './components/ThemedBackground';
import { colors } from '../theme/colors';

const screenWidth = Dimensions.get('window').width;

/* ------------------------------ Styling ------------------------------ */
const Container = styled(ThemedBackground)`
  flex: 1;
  padding: 10px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 8px 6px;
`;

const Hint = styled.Text`
  color: rgba(255, 248, 239, 0.82);
  font-size: 12px;
`;

const ThumbWrap = styled.View`
  width: ${(screenWidth - 40) / 3}px;
  height: 110px;
  margin: 5px;
  border-radius: 10px;
  overflow: hidden;
  background-color: #eee;
  align-items: center;
  justify-content: center;
`;

const Thumb = styled(Image)`
  width: 100%;
  height: 100%;
`;

const ActionBtn = styled.TouchableOpacity`
  position: absolute;
  right: 6px;
  top: 6px;
  background-color: rgba(0, 0, 0, 0.35);
  border-radius: 14px;
  padding: 4px;
`;

/* ------------------------------- Types -------------------------------- */
type SavedImage = {
  id: number;
  full_url: string;
  thumb_url: string;
  upload_date?: string;
  // raw fields that may come from backend (for safety)
  url?: string;
  thumb?: string;
  p50?: string;
  thumb_url_raw?: string;
};

/* ------------------------------- API ---------------------------------- */
const API_BASE = 'https://tanamitrain.com/tanamiAdmin/api';
const API_ORIGIN = 'https://tanamitrain.com/tanamiAdmin'; // ensure absolute URLs

const BOOKMARK_LIST_URL = `${API_BASE}/user/images-list`;
const UNBOOKMARK_URL = (id: number) => `${API_BASE}/user/images-unbookmark?id=${id}`;

function absUrl(u?: string | null): string {
  if (!u) return '';
  const s = String(u);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return API_ORIGIN + s;
  return `${API_ORIGIN}/${s}`;
}

function normalizeItem(it: any): SavedImage {
  const full = it.full_url || it.url || it.p50 || it.thumb || '';
  const thumb = it.thumb_url || it.thumb || it.p50 || full || '';
  return {
    id: Number(it.id),
    full_url: absUrl(full),
    thumb_url: absUrl(thumb),
    upload_date: String(it.upload_date || ''),
  };
}

async function apiFetch(input: RequestInfo, init: RequestInit = {}, token?: string | null) {
  const headers: any = { ...(init.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(input, { ...init, headers });
}

/* ------------------------------ Screen -------------------------------- */
const MyPhotosScreen: React.FC = () => {
  const { isAuthenticated, token } = useAuth();

  const [items, setItems] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setItems([]);
      setLastUpdated(new Date().toLocaleString());
      return;
    }

    const res = await apiFetch(BOOKMARK_LIST_URL, {}, token);
    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);

    const data = JSON.parse(raw.replace(/^\uFEFF/, '').trim());
    const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    const normalized = list
      .filter((it: any) => it && (it.url || it.full_url || it.thumb || it.p50))
      .map(normalizeItem);

    setItems(normalized);
    setLastUpdated(new Date().toLocaleString());
  }, [isAuthenticated, token]);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        Alert.alert('خطأ', 'تعذّر تحميل صوري المحفوظة.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    })();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  const viewerImages = useMemo(
    () => items.map((it) => ({ url: it.full_url })),
    [items]
  );

  const openImage = (index: number) => {
    setCurrentIndex(index);
    setViewerVisible(true);
  };

  const unbookmark = useCallback(
    async (imageId: number) => {
      if (!token) return;
      try {
        const res = await apiFetch(UNBOOKMARK_URL(imageId), { method: 'DELETE' }, token);
        if (!res.ok) throw new Error('unbookmark_failed');
        // remove locally
        setItems((prev) => prev.filter((x) => x.id !== imageId));
      } catch {
        Alert.alert('خطأ', 'تعذر إزالة الصورة من قائمتك.');
      }
    },
    [token]
  );

  const confirmUnbookmark = (imageId: number) => {
    Alert.alert(
      'إزالة الصورة',
      'هل تريد إزالة هذه الصورة من قائمتك؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'إزالة', style: 'destructive', onPress: () => unbookmark(imageId) },
      ],
      { cancelable: true }
    );
  };

  if (loading && !refreshing) {
    return (
      <Container>
        <AppLoading style={{ backgroundColor: 'transparent' }} />
      </Container>
    );
  }
  console.log(items);
  return (
    <Container>
      <Row>
        <Hint>عدد الصور: {items.length}</Hint>
        <Hint>{lastUpdated ? `آخر تحديث: ${lastUpdated}` : ''}</Hint>
      </Row>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.gold]} />
        }
   
        renderItem={({ item, index }) => (
         
          <TouchableOpacity onPress={() => openImage(index)} activeOpacity={0.9}>
            <ThumbWrap>
              <Thumb
                source={{ uri: item.thumb_url || item.full_url }}
                onError={() => {
                  if (item.thumb_url && item.thumb_url !== item.full_url) {
                    // soft fallback to full image
                    (item as any).thumb_url = item.full_url;
                  }
                }}
                resizeMode="cover"
              />
              <ActionBtn
                onPress={(e) => {
                  e.stopPropagation();
                  confirmUnbookmark(item.id);
                }}
              >
                <Icon name="trash-can-outline" size={18} color="#fff" />
              </ActionBtn>
            </ThumbWrap>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: colors.cream }}>لا توجد صور محفوظة حالياً</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 12 }}
      />

      <Modal visible={viewerVisible} transparent onRequestClose={() => setViewerVisible(false)}>
        <ImageViewer
          imageUrls={viewerImages}
          index={currentIndex}
          onCancel={() => setViewerVisible(false)}
          enableSwipeDown
          backgroundColor="#000"
          loadingRender={() => (
            <ActivityIndicator size="large" color="#eceadf" style={{ marginTop: 20 }} />
          )}
          saveToLocalByLongPress={false}
        />
      </Modal>
    </Container>
  );
};

export default MyPhotosScreen;
