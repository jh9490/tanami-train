// src/screens/HomeScreen.tsx
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
  TouchableOpacity,
} from 'react-native';
import styled from 'styled-components/native';
import Carousel from 'react-native-reanimated-carousel';
import Icon from 'react-native-vector-icons/FontAwesome';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/AppNavigator';
import CourseDetailsSheet from './sheets/CourseDetailsSheet';

I18nManager.forceRTL(true);

/* ===== layout constants ===== */
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_PADDING = 12;
const VISIBLE_WIDTH = Math.round(SCREEN_WIDTH * 0.84);  // poster width (shows neighbors)
const POSTER_RATIO = 3 / 4;                             // width : height (tall flyers)
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
  background-color: #fff1e2;
`;

/* slider */
const SlideTouchable = styled.TouchableOpacity``;
const SlideImage = styled.Image`
  width: ${SCREEN_WIDTH}px;
  height: 200px;
  border-radius: 10px;
  margin: 16px 0;
`;

/* --- Auth section --- */
const AuthCard = styled.View`
  margin: 6px ${PAGE_PADDING}px 16px;
  background: #eceadf;
  border-radius: 14px;
  padding: 14px;
  shadow-color: #000;
  shadow-opacity: 0.06;
  shadow-radius: 8px;
  shadow-offset: 0px 2px;
  elevation: 2;
`;

const AuthTitle = styled.Text`
  font-size: 14px;
  color: #0f4f30;
  font-family: 'NotoKufiArabic-Bold';
  text-align: center;
`;

const AuthSubtitle = styled.Text`
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  margin-top: 4px;
  font-family: 'NotoKufiArabic-Regular';
`;

const ActionsRow = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
`;

const PrimaryBtn = styled.TouchableOpacity`
  background: #0f4f30;
  padding: 10px 16px;
  border-radius: 10px;
  min-width: 130px;
  align-items: center;
`;
const PrimaryText = styled.Text`
  color: #eceadf;
  font-size: 13px;
  font-family: 'NotoKufiArabic-Bold';
`;
const OutlineBtn = styled.TouchableOpacity`
  background: transparent;
  border: 1px solid #0f4f30;
  padding: 10px 16px;
  border-radius: 10px;
  min-width: 130px;
  align-items: center;
`;
const OutlineText = styled.Text`
  color: #0f4f30;
  font-size: 13px;
  font-family: 'NotoKufiArabic-Bold';
`;

/* --- Sticky header for courses (title + segmented pill) --- */
const StickyWrap = styled.View`
  background-color: #fff1e2;
  padding: 6px ${PAGE_PADDING}px 0;
  z-index: 2;
  elevation: 0;
`;

const SectionTitle = styled.Text`
  font-size: 14px;
  color: #0f4f30;
  font-family: 'NotoKufiArabic-Bold';
  margin-bottom: 6px;
`;

/* Segmented control */
const Segmented = styled.View`
  align-self: center;
  background: #eee;
  border-radius: 999px;
  padding: 4px;
  margin: 0;
  flex-direction: row;
`;
const SegItem = styled.TouchableOpacity<{ active: boolean }>`
  padding: 8px 14px;
  border-radius: 999px;
  background: ${({ active }) => (active ? '#0f4f30' : 'transparent')};
  margin: 0 2px;
`;
const SegText = styled.Text<{ active: boolean }>`
  font-size: 12px;
  font-family: 'NotoKufiArabic-Bold';
  color: ${({ active }) => (active ? '#eceadf' : '#333')};
`;

/* posters */
const Section = styled.View`
  padding: 0 ${PAGE_PADDING}px;
  margin-top: -8px;
`;
const PosterStage = styled.TouchableOpacity`
  width: ${VISIBLE_WIDTH}px;
  height: ${POSTER_HEIGHT}px;
  border-radius: 16px;
  overflow: hidden;
  background-color: transparent;
`;
const PosterImage = styled.Image`
  width: 100%;
  height: 100%;
`;

/* social */
const SocialSection = styled.View`
  margin-top: 24px;
  align-items: center;
  margin-bottom: 32px;
`;
const SocialTitle = styled.Text`
  font-size: 16px;
  font-family: 'NotoKufiArabic-Regular';
  color: #0f4f30;
  margin-bottom: 12px;
`;
const IconRow = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const SocialIcon = styled.TouchableOpacity`
  width: 48px;
  height: 48px;
  border-radius: 24px;   /* exactly half of width/height → perfect circle */
  background-color: #0f4f30;
  justify-content: center;
  align-items: center;
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



export default function HomeScreen() {
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

  // Navigation + Auth
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthenticated, displayName } = useAuth();

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
          return { id: String(s.id), image: img, link: s.link ?? undefined };
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
          title: (a.course_name || '').toString().trim() || '—',
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


  const GridItem = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: '#fff1e2',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f0e4c9',
        flex: 1,
        margin: 6,
      }}
    >
      <MaterialIcon name={icon} size={28} color="#0f4f30" />
      <Text style={{ marginTop: 8, color: '#111', fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );

  /* ---- Auth Section ---- */
  /* ---- Auth Section ---- */
  const AuthSection = useCallback(() => {
    if (isAuthenticated) {
      return (
        <AuthCard>
          <AuthTitle>أهلًا، {displayName ?? 'مستخدم'}</AuthTitle>
          <AuthSubtitle>يمكنك الوصول إلى حسابك وإدارة بياناتك</AuthSubtitle>

          {/* 2x2 grid */}
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <GridItem
              icon="manage-accounts"
              label="حسابي"
              onPress={() => navigation.navigate('AccountStack', { screen: 'Account' })}
            />
            <GridItem
              icon="settings"
              label="الإعدادات"
              onPress={() => navigation.navigate('AccountStack', { screen: 'Settings' })}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <GridItem
              icon="notifications"
              label="إشعاراتي"
              onPress={() => navigation.navigate('UserStack', { screen: 'MyNotifications' })}
            />
            <GridItem
              icon="collections-bookmark"
              label="دوراتي"
              onPress={() => navigation.navigate('UserStack', { screen: 'MyCourses' })}
            />
          </View>
        </AuthCard>
      );
    }

    return (
      <AuthCard>
        <AuthTitle>سجّل دخولك الآن</AuthTitle>
        <AuthSubtitle>للوصول إلى جميع المميزات</AuthSubtitle>

        {/* Centered login button */}
        <PrimaryBtn
          style={{ alignSelf: 'center', marginTop: 16 }}
          onPress={() => navigation.navigate('AuthStack', { screen: 'SignIn' })}
        >
          <PrimaryText>تسجيل الدخول</PrimaryText>
        </PrimaryBtn>

        {/* Inline sign-up link */}
        <Text
          style={{
            marginTop: 12,
            fontSize: 13,
            color: '#0066cc',
            fontFamily: 'NotoKufiArabic-Bold',
            textAlign: 'center',
          }}
          onPress={() => navigation.navigate('AuthStack', { screen: 'SignUp' })}
        >
          ليس لديك حساب؟ سجّل الآن
        </Text>
      </AuthCard>
    );
  }, [isAuthenticated, displayName, navigation]);


  /* ---- Header (slider + AuthSection) ---- */
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

        <AuthSection />
      </View>
    ),
    [sliderItems, loading, openLinkSafe, AuthSection]
  );

  /* ---- Sticky Segmented (title + pill) ---- */
  const SegHeader = () => (
    <StickyWrap>
      <SectionTitle>الدورات</SectionTitle>
      <Segmented>
        <SegItem active={activeTab === 'current'} onPress={() => setActiveTab('current')}>
          <SegText active={activeTab === 'current'}>الحالية ({courses.current.length})</SegText>
        </SegItem>
        <SegItem active={activeTab === 'upcoming'} onPress={() => setActiveTab('upcoming')}>
          <SegText active={activeTab === 'upcoming'}>القادمة ({courses.upcoming.length})</SegText>
        </SegItem>
      </Segmented>
    </StickyWrap>
  );

  /* ---- Courses carousel ---- */
  const CoursesCarousel = () => {
    const data = courses[activeTab];
    if (loading) return <ActivityIndicator size="large" style={{ marginVertical: 12 }} />;
    if (!data.length)
      return (
        <Text style={{ textAlign: 'center', color: '#333', marginTop: 8, fontFamily: 'NotoKufiArabic-Regular' }}>
          لا توجد عناصر لعرضها حاليًا
        </Text>
      );

    return (
      <Section>
        <Carousel
          style={{ alignSelf: 'center', marginTop: 0 }}
          width={VISIBLE_WIDTH}
          height={POSTER_HEIGHT}
          data={data}
          loop={false}
          snapEnabled
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.92,
            parallaxAdjacentItemScale: 0.84,
            parallaxScrollingOffset: 52,
          }}
          panGestureHandlerProps={{ activeOffsetX: [-10, 10] }}
          renderItem={({ item }) => (
            <PosterStage
              activeOpacity={0.9}
              onPress={() => {
                setSelectedCourse(item);
                bottomSheetRef.current?.snapToIndex(1);
              }}
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
          {/* Facebook */}
          <SocialIcon onPress={() => openLinkSafe('https://www.facebook.com/tanami.train')}>
            <Icon name="facebook" size={24} color="#eceadf" />
          </SocialIcon>

          {/* Instagram */}
          <SocialIcon onPress={() => openLinkSafe('https://www.instagram.com/tanami.train')}>
            <Icon name="instagram" size={24} color="#eceadf" />
          </SocialIcon>

          {/* WhatsApp channel */}
          <SocialIcon onPress={() => openLinkSafe('https://whatsapp.com/channel/0029VaAySIQ84OmFIvyBNK1Y')}>
            <Icon name="whatsapp" size={24} color="#eceadf" />
          </SocialIcon>
        </IconRow>
      </SocialSection>
    ),
    [openLinkSafe]
  );


  // Turn HTML-ish headlines into clean bullet lines
  const cleanToBullets = (raw?: string | null): string[] => {
    if (!raw) return [];

    let s = String(raw);

    // Normalize common HTML → plain text
    s = s
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\/\s*li\s*>/gi, '\n')
      .replace(/<\s*li[^>]*>/gi, '- ')         // keep bullet indicator
      .replace(/<\s*\/?(ul|ol|p|div)[^>]*>/gi, '\n')
      .replace(/&nbsp;?/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/<[^>]*>/g, '');                 // strip any remaining tags

    // Unify separators -> newlines
    s = s
      .replace(/[;•·]+/g, '\n')                 // many feeds use ; or •
      .replace(/\u00A0/g, ' ')                  // non-breaking space
      .replace(/\r/g, '')
      .replace(/\n{2,}/g, '\n')                 // collapse extra newlines
      .trim();

    // Split to lines; accept lines that have text
    const lines = s.split('\n')
      .map(l => l.replace(/^\s*[-–*]\s*/, ''))  // remove leading dashes if present
      .map(l => l.trim())
      .filter(l => l.length > 0);

    return lines;
  };


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        {/* stickyHeaderIndices={[1]} -> child index #1 sticks (SegHeader) */}
        <ScrollView
          stickyHeaderIndices={[1]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <HeaderBlock />
          <SegHeader />
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
        <BottomSheetView style={{ paddingVertical: 8 }}>
          {selectedCourse ? (
            <CourseDetailsSheet
              title={selectedCourse.title}
              headLines={selectedCourse.headLines}
              maxHeight={360}   // so it scrolls nicely inside the sheet
            />
          ) : null}
        </BottomSheetView>
      </BottomSheet>

    </GestureHandlerRootView>
  );
}
