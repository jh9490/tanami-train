import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  View,
  I18nManager,
  Text,
  useWindowDimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import styled from 'styled-components/native';
import Carousel from 'react-native-reanimated-carousel';
import Icon from 'react-native-vector-icons/FontAwesome';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

I18nManager.forceRTL(true);

/* ===== layout constants ===== */
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_PADDING = 12;

/** width of each poster page to leave a peek of neighbors */
const VISIBLE_WIDTH = Math.round(SCREEN_WIDTH * 0.84);

/** make posters taller (try 2/3, 3/4, or 4/5 depending on your flyers) */
const POSTER_RATIO = 3 / 4; // width : height -> 3:4 is tall
const POSTER_HEIGHT = Math.round(VISIBLE_WIDTH / POSTER_RATIO);

type CourseLite = {
  id: string;
  title: string;
  image: string;
  headLines: string;
};

const BASE = 'http://tanamitrain.com/tanamiAdmin';
const SLIDERS_URL = `${BASE}/api/mobile-app/sliders`;
const ACTIVITIES_URL = `${BASE}/api/mobile-app/activities`;

/* ===== styled ===== */
const Screen = styled.View`
  flex: 1;
  background-color: #fff8e5;
`;

const SlideTouchable = styled.TouchableOpacity``;
const SlideImage = styled.Image`
  width: ${SCREEN_WIDTH}px;
  height: 200px;
  border-radius: 10px;
  margin: 16px 0;
`;

const Section = styled.View`
  padding: 0 ${PAGE_PADDING}px;
`;

const FilterContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-bottom: 16px;
  margin-top: 10px;
`;

const FilterButton = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${({ active }) => (active ? '#c9912b' : '#eee')};
  padding: 10px 16px;
  margin: 0 8px;
  border-radius: 10px;
`;

const FilterText = styled.Text<{ active: boolean }>`
  color: ${({ active }) => (active ? '#fff' : '#333')};
  font-size: 14px;
  font-family: 'NotoKufiArabic-Regular';
`;

/* poster stage: no gray bg, just rounded + subtle shadow */
const PosterStage = styled.TouchableOpacity`
  width: ${VISIBLE_WIDTH}px;
  height: ${POSTER_HEIGHT}px;
  border-radius: 16px;      /* keep rounding, or set 0 if you want square */
  overflow: hidden;         /* clip image to rounded corners */
  background-color: transparent;
  /* removed all shadow/elevation */
`;

const PosterImage = styled.Image`
  width: 100%;
  height: 100%;
`; //

/* social */
const SocialSection = styled.View`
  margin-top: 24px;
  align-items: center;
  margin-bottom: 32px;
`;
const SocialTitle = styled.Text`
  font-size: 16px;
  font-family: 'NotoKufiArabic-Regular';
  color: #c9912b;
  margin-bottom: 12px;
`;
const IconRow = styled.View`
  flex-direction: row;
  justify-content: center;
`;
const SocialIcon = styled.TouchableOpacity`
  background-color: #000;
  padding: 12px;
  border-radius: 30px;
  margin: 0 8px;
`;

/* ===== utils ===== */
const toAbs = (rel?: string | null) => (rel ? `${BASE}${rel}` : undefined);

const isCurrentByDate = (start: string, end?: string, live?: boolean) => {
  try {
    const today = new Date();
    const s = new Date(start + 'T00:00:00');
    const e = end ? new Date(end + 'T23:59:59') : undefined;
    if (live) return true;
    if (e) return s <= today && today <= e;
    return s <= today;
  } catch {
    return !!live;
  }
};

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming'>('current');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sliderItems, setSliderItems] = useState<Array<{ id: string; image: string; link?: string }>>([]);
  const [courses, setCourses] = useState<{ current: CourseLite[]; upcoming: CourseLite[] }>({
    current: [],
    upcoming: [],
  });

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['30%', '65%'], []);
  const [selectedCourse, setSelectedCourse] = useState<CourseLite | null>(null);
  const { width: windowWidth } = useWindowDimensions();

  const openLinkSafe = useCallback(async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert('تعذّر فتح الرابط', url);
    } catch {
      Alert.alert('حدث خطأ أثناء فتح الرابط');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([fetch(SLIDERS_URL), fetch(ACTIVITIES_URL)]);
      const sJson = await sRes.json();
      const aJson = await aRes.json();

      const mappedSliders = sJson
        .map((s: any) => {
          const img = toAbs(s.image0?.p50 || s.image0?.url);
          if (!img) return null;
          return { id: s.id, image: img, link: s.link ?? undefined };
        })
        .filter(Boolean) as Array<{ id: string; image: string; link?: string }>;

      const current: CourseLite[] = [];
      const upcoming: CourseLite[] = [];

      aJson.forEach((a: any) => {
        const bucket =
          a.status_simple === 'current'
            ? 'current'
            : a.status_simple === 'upcoming'
              ? 'upcoming'
              : isCurrentByDate(a.date, a.end_date, a.live)
                ? 'current'
                : 'upcoming';

        const item: CourseLite = {
          id: String(a.id),
          title: a.course_name?.trim() || '—',
          image: a.image_url,
          headLines: a.course?.course_head_lines || '',
        };
        (bucket === 'current' ? current : upcoming).push(item);
      });

      setSliderItems(mappedSliders);
      setCourses({ current, upcoming });
    } catch {
      Alert.alert('خطأ في تحميل البيانات', 'تأكد من الاتصال وحاول مجددًا.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  /* ===== header (top marketing slider + tabs) ===== */
  const HeaderBlock = useCallback(
    () => (
      <View>
        {sliderItems.length > 0 ? (
          <Carousel
            width={SCREEN_WIDTH}
            height={200}
            autoPlay
            loop
            data={sliderItems}
            scrollAnimationDuration={1000}
            renderItem={({ item }) => (
              <SlideTouchable onPress={() => item.link && openLinkSafe(item.link!)}>
                <SlideImage source={{ uri: item.image }} resizeMode="cover" />
              </SlideTouchable>
            )}
          />
        ) : loading ? (
          <ActivityIndicator size="large" style={{ marginVertical: 24 }} />
        ) : null}

        <FilterContainer>
          <FilterButton active={activeTab === 'current'} onPress={() => setActiveTab('current')}>
            <FilterText active={activeTab === 'current'}>الدورات الحالية</FilterText>
          </FilterButton>
          <FilterButton active={activeTab === 'upcoming'} onPress={() => setActiveTab('upcoming')}>
            <FilterText active={activeTab === 'upcoming'}>الدورات القادمة</FilterText>
          </FilterButton>
        </FilterContainer>
      </View>
    ),
    [sliderItems, loading, activeTab, openLinkSafe]
  );

  /* ===== courses carousel (posters only, peek + zoom) ===== */
  const CoursesCarousel = () => {
    const data = courses[activeTab];
    if (loading) return <ActivityIndicator size="large" style={{ marginVertical: 24 }} />;
    if (!data.length)
      return (
        <Text style={{ textAlign: 'center', color: '#333', marginTop: 8, fontFamily: 'NotoKufiArabic-Regular' }}>
          لا توجد عناصر لعرضها حاليًا
        </Text>
      );

    return (
      <Section>
        <Carousel
          style={{ alignSelf: 'center' }}
          width={VISIBLE_WIDTH}
          height={POSTER_HEIGHT}
          data={data}
          loop={false}
          snapEnabled
          mode="parallax"
          modeConfig={{
            /** center slide a bit larger */
            parallaxScrollingScale: 0.92,          // 0.92 = 8% larger than neighbors
            parallaxAdjacentItemScale: 0.84,       // neighbors smaller
            parallaxScrollingOffset: 52,           // how much neighbors peek
          }}
          panGestureHandlerProps={{ activeOffsetX: [-10, 10] }}
          renderItem={({ item }) => (
            <PosterStage
            activeOpacity={0.9}
            onPress={() => { setSelectedCourse(item); bottomSheetRef.current?.snapToIndex(1); }}
          >
            <PosterImage source={{ uri: item.image }} resizeMode="contain" />
          </PosterStage>
          )}
        />
      </Section>
    );
  };

  const Footer = useCallback(
    () => (
      <SocialSection>
        <SocialTitle>تابعنا على مواقع التواصل</SocialTitle>
        <IconRow>
          <SocialIcon onPress={() => openLinkSafe('https://www.instagram.com/tanami.train')}>
            <Icon name="instagram" size={24} color="#fff" />
          </SocialIcon>
          <SocialIcon onPress={() => openLinkSafe('https://wa.me/971000000')}>
            <Icon name="whatsapp" size={24} color="#fff" />
          </SocialIcon>
          <SocialIcon onPress={() => openLinkSafe('https://www.tiktok.com/@tanami.train')}>
            <Icon name="music" size={24} color="#fff" />
          </SocialIcon>
          <SocialIcon onPress={() => openLinkSafe('https://www.youtube.com/@tanamitrain')}>
            <Icon name="youtube" size={24} color="#fff" />
          </SocialIcon>
        </IconRow>
      </SocialSection>
    ),
    [openLinkSafe]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <HeaderBlock />
          <CoursesCarousel />
          <Footer />
        </ScrollView>
      </Screen>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => setSelectedCourse(null)}
      >
        <BottomSheetView style={{ padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{selectedCourse?.title}</Text>
          {selectedCourse?.headLines ? (
            <Text style={{ fontSize: 14, lineHeight: 22 }}>
              {selectedCourse?.headLines.replace(/<[^>]*>?/gm, '') || 'لا توجد تفاصيل متاحة.'}
            </Text>
          ) : (
            <Text>لا توجد تفاصيل متاحة.</Text>
          )}
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

export default HomeScreen;
