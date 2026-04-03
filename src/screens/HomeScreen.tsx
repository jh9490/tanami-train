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
  Image,
} from 'react-native';
import styled from 'styled-components/native';
import Carousel from 'react-native-reanimated-carousel';
import Animated, { interpolate, Extrapolate } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/AppNavigator';
import PlaceholderPoster from './components/PlaceholderPoster';
import CourseDialog, { CourseLite } from './components/CourseDialog'; // ✅ reusable dialog

I18nManager.forceRTL(true);

/* ===== layout constants ===== */
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_PADDING = 12;
const VISIBLE_WIDTH = Math.round(SCREEN_WIDTH * 0.84);  // poster width (shows neighbors)
const POSTER_RATIO = 3 / 4;                             // width : height (tall flyers)
const POSTER_HEIGHT = Math.round(VISIBLE_WIDTH / POSTER_RATIO);
const GRID_GAP = 10;

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

const GridItemWrap = styled.TouchableOpacity`
  background-color: #fff1e2;
  border-radius: 12px;
  padding-vertical: 16px;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: #f0e4c9;
  flex: 1;
  margin: 6px;
`;

const GridItemLabel = styled.Text`
  margin-top: 8px;
  color: #111;
  font-family: 'NotoKufiArabic-Bold';
  font-size: 12px;
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
  text-align: center;
`;

/* Segmented */
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

/* posters – grid items */
const GridWrap = styled.View`
  padding: 6px ${PAGE_PADDING}px 0;
`;
const GridRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${GRID_GAP}px;
`;
const Card = styled.TouchableOpacity<{ w: number; h: number }>`
  width: ${({ w }) => w}px;
  height: ${({ h }) => h}px;
  border-radius: 16px;
  overflow: hidden;
  background: #f6efe6;
  position: relative;
`;
const CardTitle = styled.Text`
  flex: 1;
  text-align: center;
  text-align-vertical: center;
  padding: 10px;
  font-family: 'NotoKufiArabic-Bold';
  color: #0f4f30;
`;

/* social */
const SocialSection = styled.View`
  margin-top: 24px;
  align-items: center;
  margin-bottom: 12px;
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
  border-radius: 24px;
  background-color: #0f4f30;
  justify-content: center;
  align-items: center;
  margin: 0 8px;
`;

const Section = styled.View`
  padding: 0 ${PAGE_PADDING}px;
  margin-top: -8px;
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

  // ✅ NEW: use shared dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseLite | null>(null);

  const { width: windowWidth } = useWindowDimensions();

  // Navigation + Auth
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthenticated, displayName, token } = useAuth(); // ← token

  type SliderItem = { id: string; image: string; link?: string };
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
          image: a.image_url ?? null,
          headLines: a.course?.course_head_lines || '',
          nameAr: a.course?.name_ar ?? null,
          days: a.course?.days ?? null,
          hours: a.course?.hours ?? null,
          date: a.date ?? null,
          endDate: a.end_date ?? null,
          live: !!a.live,
          cost: a.course?.cost ?? null,
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
    <GridItemWrap onPress={onPress} activeOpacity={0.8}>
      <MaterialIcon name={icon} size={28} color="#0f4f30" />
      <GridItemLabel>{label}</GridItemLabel>
    </GridItemWrap>
  );

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
          <View style={{ flexDirection: 'row' }}>
            <GridItem
              icon="how-to-reg"
              label="طلبات التسجيل"
              onPress={() => navigation.navigate('UserStack', { screen: 'MyRegistrationRequests' })}
            />
            <GridItem
              icon="verified"
              label="تحقق من شهادة"
              onPress={() => navigation.navigate('UserStack', { screen: 'VerifyCertificateScreen' })}
            />
          </View>
        </AuthCard>
      );
    }

    return (
      <AuthCard>
      <AuthTitle>ابدأ الرحلة مع تنامي ترين</AuthTitle>
      <AuthSubtitle>أنشئ حسابًا للوصول إلى جميع المميزات</AuthSubtitle>
    
      {/* ✅ Sign Up as primary CTA */}
      <PrimaryBtn
        style={{ alignSelf: 'center', marginTop: 16 }}
        onPress={() => navigation.navigate('AuthStack', { screen: 'SignUp' })}
      >
        <PrimaryText>إنشاء حساب</PrimaryText>
      </PrimaryBtn>
    
      {/* ✅ Sign In as a lightweight link */}
      <Text
        style={{
          marginTop: 12,
          fontSize: 13,
          color: '#0f4f30',
          fontFamily: 'NotoKufiArabic-Bold',
          textAlign: 'center',
          textDecorationLine: 'underline',
        }}
        onPress={() => navigation.navigate('AuthStack', { screen: 'SignIn' })}
      >
        لديك حساب بالفعل؟ سجّل الدخول من هنا
      </Text>
    </AuthCard>
    );
  }, [isAuthenticated, displayName, navigation]);

  /* ---- Header (slider + AuthSection) ---- */
  const HeaderBlock = useCallback(
    () => (
      <View>
        {sliderItems.length > 0 ? (
          <Carousel<SliderItem>
            width={SCREEN_WIDTH}
            height={200}
            loop
            autoPlay
            autoPlayInterval={6000}
            scrollAnimationDuration={1200}
            windowSize={5}
            mode="parallax"
            /** value is a number (offset from center) */
            customAnimation={(value: number) => {
              'worklet';
              const a = Math.abs(value); // 0 = focused, 1 = one page away
              const opacity = interpolate(a, [0, 0.5, 1], [1, 0.6, 0], Extrapolate.CLAMP);
              const scale = interpolate(a, [0, 1], [1, 0.98], Extrapolate.CLAMP);
              return { opacity, transform: [{ scale }] };
            }}
            onConfigurePanGesture={(g) => {
              'worklet';
              g.activeOffsetX([-20, 20]);
              g.failOffsetY([-10, 10]);
            }}
            renderItem={({ item }: { item: SliderItem }) => (
              <SlideTouchable
                activeOpacity={0.9}
                onPress={() => item.link && openLinkSafe(item.link)}
                style={{ width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#e9e7e0' }}
              >
                <SlideImage
                  source={{ uri: item.image }}
                  resizeMode="cover"
                  style={{ width: '100%', height: '100%' }}
                />
              </SlideTouchable>
            )}
            data={sliderItems}
            keyExtractor={(it) => it.id}
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
      <SectionTitle>يحدث في تنامي</SectionTitle>
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

  /* ---- GRID of posters ---- */
  const CoursesGrid = () => {
    const data = courses[activeTab];
    const columns = windowWidth >= 420 ? 2 : 2;
    const totalGaps = (columns - 1) * GRID_GAP;
    const cardW = Math.floor((windowWidth - PAGE_PADDING * 2 - totalGaps) / columns);
    const cardH = Math.round(cardW / POSTER_RATIO);

    if (loading) return <ActivityIndicator size="large" style={{ marginVertical: 12 }} />;
    if (!data.length)
      return (
        <Text style={{ textAlign: 'center', color: '#333', marginTop: 8, fontFamily: 'NotoKufiArabic-Regular' }}>
          لا توجد عناصر لعرضها حاليًا
        </Text>
      );

    // chunk to rows
    const rows: CourseLite[][] = [];
    for (let i = 0; i < data.length; i += columns) rows.push(data.slice(i, i + columns));

    return (
      <GridWrap>
        {rows.map((row, idx) => (
          <GridRow key={`r-${idx}`}>
            {row.map((item) => (
              <Card
                key={item.id}
                w={cardW}
                h={cardH}
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedCourse(item);
                  setDetailsOpen(true);
                }}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <PlaceholderPoster width={cardW} height={cardH} />
                )}

                {/* title overlay */}
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1,
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontFamily: 'NotoKufiArabic-Bold',
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.nameAr || item.title || '—'}
                  </Text>
                </View>
              </Card>
            ))}
            {row.length === 1 && columns === 2 ? <View style={{ width: cardW }} /> : null}
          </GridRow>
        ))}
      </GridWrap>
    );
  };

  /* ---- Social above END carousel ---- */
  const FooterSocial = useCallback(
    () => (
      <SocialSection>
        <SocialTitle>تابعنا على مواقع التواصل</SocialTitle>
        <IconRow>
          <SocialIcon onPress={() => openLinkSafe('https://www.facebook.com/tanami.train')}>
            <Icon name="facebook" size={24} color="#eceadf" />
          </SocialIcon>
          <SocialIcon onPress={() => openLinkSafe('https://www.instagram.com/tanami.train')}>
            <Icon name="instagram" size={24} color="#eceadf" />
          </SocialIcon>
          <SocialIcon onPress={() => openLinkSafe('https://whatsapp.com/channel/0029VaAySIQ84OmFIvyBNK1Y')}>
            <Icon name="whatsapp" size={24} color="#eceadf" />
          </SocialIcon>
        </IconRow>
      </SocialSection>
    ),
    [openLinkSafe]
  );

  /* ---- Posters carousel at the END ---- */
  const EndPostersCarousel = () => {
    const data = courses[activeTab];
    if (!data.length) return null;

    return (
      <Section>
        <Carousel
          style={{ alignSelf: 'center', marginTop: 6 }}
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
          onConfigurePanGesture={(g) => {
            'worklet';
            g.activeOffsetX([-20, 20]);
            g.failOffsetY([-10, 10]);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setSelectedCourse(item);
                setDetailsOpen(true);
              }}
              style={{
                width: VISIBLE_WIDTH,
                height: POSTER_HEIGHT,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: 'transparent',
              }}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              ) : (
                <View style={{ flex: 1, backgroundColor: '#eceadf', justifyContent: 'center' }}>
                  <CardTitle>{item.nameAr || item.title || '—'}</CardTitle>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </Section>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <ScrollView
          stickyHeaderIndices={[1]}
          refreshControl={<RefreshControl enabled={false} refreshing={false} onRefresh={() => { }} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <HeaderBlock />
          <SegHeader />
          <CoursesGrid />

          {/* Social icons ABOVE the end carousel */}
          <FooterSocial />
        </ScrollView>
      </Screen>

      {/* ✅ Shared dialog used here */}
      <CourseDialog
        visible={detailsOpen}
        course={selectedCourse}
        onClose={() => setDetailsOpen(false)}
        isAuthenticated={isAuthenticated}
        token={token}
      />
    </GestureHandlerRootView>
  );
}
