// GalleryScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Text,
  View,
} from 'react-native';
import styled from 'styled-components/native';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';

const screenWidth = Dimensions.get('window').width;

const Container = styled.View`
  flex: 1;
  background-color: #fff1e2;
  padding: 10px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 8px 6px;
`;

const Hint = styled.Text`
  color: #333;
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

const HeartBtn = styled(TouchableOpacity)`
  position: absolute;
  right: 6px;
  top: 6px;
  background-color: rgba(0,0,0,0.35);
  border-radius: 14px;
  padding: 4px;
`;

type ApiImage = {
  id: number;
  full_url: string;
  thumb_url: string;
  upload_date: string;
};

const API_BASE = 'https://tanamitrain.com/tanamiAdmin/api';
// Public/admin gallery (all images of type=gallery)
const GALLERY_URL = `${API_BASE}/mobile-app/gallery`;
// User-specific bookmarks
const BOOKMARK_LIST_URL = `${API_BASE}/user/images-list`;
const BOOKMARK_URL = `${API_BASE}/user/images-bookmark`; // POST
const UNBOOKMARK_URL = (id: number) => `${API_BASE}/user/images-unbookmark?id=${id}`;

// Helper: authenticated fetch with token header (when provided)
async function apiFetch(input: RequestInfo, init: RequestInit = {}, token?: string | null) {
  const headers: any = { ...(init.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(input, { ...init, headers });
}

const GalleryScreen: React.FC = () => {
  const { isAuthenticated, token } = useAuth();

  const [items, setItems] = useState<ApiImage[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchGallery = useCallback(async () => {
    const res = await fetch(GALLERY_URL);
    const raw = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);
    const data = JSON.parse(raw.replace(/^\uFEFF/, '').trim());
    const list = Array.isArray(data) ? data : [];
    const sanitized: ApiImage[] = list
      .filter((it) => it && (it.thumb_url || it.full_url || it.url || it.thumb))
      .map((it) => ({
        id: Number(it.id),
        full_url: String(it.full_url || it.url || ''),
        thumb_url: String(it.thumb_url || it.thumb || it.full_url || it.url || ''),
        upload_date: String(it.upload_date || ''),
      }));
    setItems(sanitized);
  }, []);

  const fetchBookmarks = useCallback(async () => {
    // Guests don't have bookmarks
    if (!isAuthenticated || !token) {
      setBookmarkedIds(new Set());
      return;
    }
    try {
      const res = await apiFetch(BOOKMARK_LIST_URL, {}, token);
      const raw = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);
      const data = JSON.parse(raw.replace(/^\uFEFF/, '').trim());
      const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      const ids = new Set<number>(list.map((x: any) => Number(x.id)));
      setBookmarkedIds(ids);
    } catch {
      // If bookmark list fails, keep empty; user can still view public gallery
      setBookmarkedIds(new Set());
    }
  }, [isAuthenticated, token]);

  const refreshAll = useCallback(async () => {
    await fetchGallery();
    await fetchBookmarks();
    setLastUpdated(new Date().toLocaleString());
  }, [fetchGallery, fetchBookmarks]);

  useEffect(() => {
    (async () => {
      try {
        await refreshAll();
      } catch {
        Alert.alert('خطأ', 'تعذّر تحميل المعرض. تأكد من الاتصال بالإنترنت.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    })();
  }, [refreshAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshAll().finally(() => setRefreshing(false));
  }, [refreshAll]);

  const viewerImages = useMemo(
    () => items.map((it) => ({ url: it.full_url })),
    [items]
  );

  const openImage = (index: number) => {
    setCurrentIndex(index);
    setViewerVisible(true);
  };

  const toggleBookmark = useCallback(
    async (imageId: number) => {
      if (!isAuthenticated || !token) {
        Alert.alert('تسجيل الدخول', 'الرجاء تسجيل الدخول لحفظ الصور في مكتبتك.');
        return;
      }
      const isBookmarked = bookmarkedIds.has(imageId);

      // optimistic UI
      const next = new Set(bookmarkedIds);
      isBookmarked ? next.delete(imageId) : next.add(imageId);
      setBookmarkedIds(next);

      try {
        if (isBookmarked) {
          const res = await apiFetch(UNBOOKMARK_URL(imageId), { method: 'DELETE' }, token);
          if (!res.ok) throw new Error('unbookmark_failed');
        } else {
          const res = await apiFetch(
            BOOKMARK_URL,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_id: imageId }),
            },
            token
          );
          if (!res.ok) throw new Error('bookmark_failed');
        }
      } catch {
        // rollback optimistic change on failure
        const rollback = new Set(bookmarkedIds);
        isBookmarked ? rollback.add(imageId) : rollback.delete(imageId);
        setBookmarkedIds(rollback);
        Alert.alert('خطأ', 'تعذر حفظ التغيير. حاول مرة أخرى.');
      }
    },
    [bookmarkedIds, isAuthenticated, token]
  );

  if (loading && !refreshing) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#111" style={{ marginTop: 24 }} />
      </Container>
    );
  }

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111" />
        }
        renderItem={({ item, index }) => {
          const isSaved = bookmarkedIds.has(item.id);
          return (
            <TouchableOpacity onPress={() => openImage(index)} activeOpacity={0.9}>
              <ThumbWrap>
                <Thumb
                  source={{ uri: item.thumb_url || item.full_url }}
                  onError={() => {
                    // fallback to full image if thumb fails
                    if (item.thumb_url !== item.full_url) {
                      item.thumb_url = item.full_url;
                    }
                  }}
                  resizeMode="cover"
                />
                {isAuthenticated && (
                  <HeartBtn
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleBookmark(item.id);
                    }}
                  >
                    <Icon
                      name={isSaved ? 'heart' : 'heart-outline'}
                      size={18}
                      color={isSaved ? '#ff5a5f' : '#ffffff'}
                    />
                  </HeartBtn>
                )}
              </ThumbWrap>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: '#0f4f30' }}>لا توجد صور حالياً</Text>
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

export default GalleryScreen;
