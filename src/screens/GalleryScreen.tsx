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

const screenWidth = Dimensions.get('window').width;

const Container = styled.View`
  flex: 1;
  background-color: #fff8e5;
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

type ApiImage = {
  id: number;
  full_url: string;
  thumb_url: string;
  upload_date: string;
};

const GALLERY_URL = 'http://tanamitrain.com/tanamiAdmin/api/mobile-app/gallery';

const GalleryScreen: React.FC = () => {
  const [items, setItems] = useState<ApiImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchGallery = useCallback(async () => {
    try {
      // 1) fetch
      const res = await fetch(GALLERY_URL);
      let data: any = null;

      // 2) parse robustly (some servers send text/html)
      const raw = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);
      }
      try {
        data = JSON.parse(raw);
      } catch {
        // sometimes BOM or stray chars — attempt to clean
        const cleaned = raw.replace(/^\uFEFF/, '').trim();
        data = JSON.parse(cleaned);
      }

      // 3) validate shape -> array of { id, full_url, thumb_url }
      const list = Array.isArray(data) ? data : [];
      const sanitized: ApiImage[] = list
        .filter((it) => it && (it.thumb_url || it.full_url))
        .map((it) => ({
          id: Number(it.id),
          full_url: String(it.full_url || ''),
          thumb_url: String(it.thumb_url || it.full_url || ''),
          upload_date: String(it.upload_date || ''),
        }));

      setItems(sanitized);
      setLastUpdated(new Date().toLocaleString());
    } catch (e: any) {
      Alert.alert('خطأ', 'تعذّر تحميل المعرض. تأكد من الاتصال بالإنترنت.');
      // optional: console.log(e?.message);
      setItems([]); // ensure state set
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGallery();
  }, [fetchGallery]);

  // For ImageViewer
  const viewerImages = useMemo(
    () => items.map((it) => ({ url: it.full_url })),
    [items]
  );

  const openImage = (index: number) => {
    setCurrentIndex(index);
    setViewerVisible(true);
  };

  if (loading && !refreshing) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#111" style={{ marginTop: 24 }} />
      </Container>
    );
  }

  return (
    <Container>
      {/* Tiny debug header so you can confirm we have data */}
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
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => openImage(index)}>
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
            </ThumbWrap>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text>لا توجد صور حالياً</Text>
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
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
          )}
          saveToLocalByLongPress={false}
        />
      </Modal>
    </Container>
  );
};

export default GalleryScreen;
