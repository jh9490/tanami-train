import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  I18nManager,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import styled from 'styled-components/native';
import Carousel from 'react-native-reanimated-carousel';
import { Extrapolate, interpolate } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { openLinkSafe } from '../util/Linker';
import PlaceholderPoster from './components/PlaceholderPoster';
import CourseDialog, { CourseLite } from './components/CourseDialog';
import AppLoading from './components/AppLoading';

I18nManager.forceRTL(true);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_PADDING = 12;
const POSTER_RATIO = 3 / 4;
const GRID_GAP = 10;

const BASE = 'http://tanamitrain.com/tanamiAdmin';
const SLIDERS_URL = `${BASE}/api/mobile-app/sliders`;
const ACTIVITIES_URL = `${BASE}/api/mobile-app/activities`;

type SliderItem = { id: string; image: string; link?: string };
type CourseBucketKey = 'current' | 'upcoming';
type HomeExternalLink = {
  id: string;
  iconName: string;
  label: string;
  url: string;
};
type HomeGridItemProps = {
  icon: string;
  label: string;
  onPress: () => void;
};
type CourseSection = {
  key: CourseBucketKey;
  title: string;
  items: CourseLite[];
};

const HOME_EXTERNAL_LINKS: HomeExternalLink[] = [
  {
    id: 'facebook',
    iconName: 'facebook',
    label: 'فيسبوك',
    url: 'https://www.facebook.com/tanami.train',
  },
  {
    id: 'instagram',
    iconName: 'instagram',
    label: 'إنستغرام',
    url: 'https://www.instagram.com/tanami.train',
  },
  {
    id: 'whatsapp',
    iconName: 'whatsapp',
    label: 'واتساب',
    url: 'https://whatsapp.com/channel/0029VaAySIQ84OmFIvyBNK1Y',
  },
  {
    id: 'website',
    iconName: 'globe',
    label: 'الموقع الإلكتروني',
    url: 'http://tanamitrain.com',
  },
];

const Screen = styled.View`
  flex: 1;
  background-color: #fff1e2;
`;

const SlideTouchable = styled.TouchableOpacity``;
const SlideImage = styled.Image`
  width: ${SCREEN_WIDTH}px;
  height: 200px;
  border-radius: 10px;
  margin: 16px 0;
`;

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

const CoursesHeader = styled.View`
  padding: 10px ${PAGE_PADDING}px 0;
`;

const SectionTitle = styled.Text`
  font-size: 14px;
  color: #0f4f30;
  font-family: 'NotoKufiArabic-Bold';
  margin-bottom: 6px;
  text-align: center;
`;

const CourseSectionBlock = styled.View`
  margin-top: 10px;
`;

const EmptyCoursesText = styled.Text`
  text-align: center;
  color: #333;
  margin-top: 10px;
  padding: 0 ${PAGE_PADDING}px;
  font-family: 'NotoKufiArabic-Regular';
`;

const GridWrap = styled.View`
  padding: 0 ${PAGE_PADDING}px;
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

const CourseRibbon = styled.View<{ w: number }>`
  position: absolute;
  top: ${({ w }) => Math.max(8, Math.round(w * 0.06))}px;
  left: ${({ w }) => Math.round((w - Math.max(72, Math.min(104, w * 0.54))) / 2)}px;
  width: ${({ w }) => Math.max(72, Math.min(104, Math.round(w * 0.54)))}px;
  height: ${({ w }) => Math.max(22, Math.min(28, Math.round(w * 0.16)))}px;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  z-index: 2;
`;

const CourseRibbonText = styled.Text`
  color: #0f4f30;
  font-family: 'NotoKufiArabic-Bold';
  font-size: 10px;
  text-align: center;
  writing-direction: rtl;
`;

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
  align-items: center;
  flex-wrap: wrap;
`;

const SocialIcon = styled.TouchableOpacity`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #0f4f30;
  justify-content: center;
  align-items: center;
  margin: 6px 8px;
`;

const toAbs = (rel?: string | null) => (rel ? `${BASE}${rel}` : undefined);

const HomeGridItem = ({ icon, label, onPress }: HomeGridItemProps) => (
  <GridItemWrap onPress={onPress} activeOpacity={0.8}>
    <MaterialIcon name={icon} size={28} color="#0f4f30" />
    <GridItemLabel>{label}</GridItemLabel>
  </GridItemWrap>
);

const isCurrentByDate = (start: string, end?: string, live?: boolean) => {
  try {
    const today = new Date();
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = end ? new Date(`${end}T23:59:59`) : undefined;

    if (live) return true;
    if (endDate) return startDate <= today && today <= endDate;
    return startDate <= today;
  } catch {
    return !!live;
  }
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [courses, setCourses] = useState<{ current: CourseLite[]; upcoming: CourseLite[] }>({
    current: [],
    upcoming: [],
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseLite | null>(null);

  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthenticated, displayName, token } = useAuth();

  const courseSections = useMemo<CourseSection[]>(
    () =>
      [
        { key: 'current' as const, title: 'حاليا', items: courses.current },
        { key: 'upcoming' as const, title: 'قادمة', items: courses.upcoming },
      ].filter(section => section.items.length > 0),
    [courses],
  );

  const columns = 2;
  const totalGaps = (columns - 1) * GRID_GAP;
  const cardW = Math.floor((windowWidth - PAGE_PADDING * 2 - totalGaps) / columns);
  const cardH = Math.round(cardW / POSTER_RATIO);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [slidersResponse, activitiesResponse] = await Promise.all([fetch(SLIDERS_URL), fetch(ACTIVITIES_URL)]);
      const slidersJson = await slidersResponse.json();
      const activitiesJson = await activitiesResponse.json();

      const mappedSliders = slidersJson
        .map((slider: any) => {
          const image = toAbs(slider.image0?.p50 || slider.image0?.url);
          if (!image) return null;
          return { id: String(slider.id), image, link: slider.link ?? undefined };
        })
        .filter(Boolean) as SliderItem[];

      const nextCourses: { current: CourseLite[]; upcoming: CourseLite[] } = {
        current: [],
        upcoming: [],
      };

      activitiesJson.forEach((activity: any) => {
        const bucket: CourseBucketKey =
          activity.status_simple === 'current'
            ? 'current'
            : activity.status_simple === 'upcoming'
              ? 'upcoming'
              : isCurrentByDate(activity.date, activity.end_date, activity.live)
                ? 'current'
                : 'upcoming';

        const item: CourseLite = {
          id: String(activity.id),
          title: (activity.course_name || '').toString().trim() || '—',
          image: activity.image_url ?? null,
          headLines: activity.course?.course_head_lines || '',
          nameAr: activity.course?.name_ar ?? null,
          days: activity.course?.days ?? null,
          hours: activity.course?.hours ?? null,
          date: activity.date ?? null,
          endDate: activity.end_date ?? null,
          live: !!activity.live,
          cost: activity.course?.cost ?? null,
        };

        nextCourses[bucket].push(item);
      });

      setSliderItems(mappedSliders);
      setCourses(nextCourses);
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

  const renderCourseGrid = (section: CourseSection) => {
    const rows: CourseLite[][] = [];
    for (let index = 0; index < section.items.length; index += columns) {
      rows.push(section.items.slice(index, index + columns));
    }

    return (
      <GridWrap>
        {rows.map((row, rowIndex) => (
          <GridRow key={`row-${rowIndex}`}>
            {row.map(item => (
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
                  <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <PlaceholderPoster width={cardW} height={cardH} />
                )}

                <CourseRibbon pointerEvents="none" w={cardW}>
                  <CourseRibbonText numberOfLines={1}>{section.title}</CourseRibbonText>
                </CourseRibbon>

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

            {row.length === 1 ? <View style={{ width: cardW }} /> : null}
          </GridRow>
        ))}
      </GridWrap>
    );
  };

  const renderAuthSection = () => {
    if (isAuthenticated) {
      return (
        <AuthCard>
          <AuthTitle>أهلًا، {displayName ?? 'مستخدم'}</AuthTitle>
          <AuthSubtitle>يمكنك الوصول إلى حسابك وإدارة بياناتك</AuthSubtitle>

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <HomeGridItem
              icon="manage-accounts"
              label="حسابي"
              onPress={() => navigation.navigate('AccountStack', { screen: 'Account' })}
            />
            <HomeGridItem
              icon="description"
              label="سيرتي"
              onPress={() => navigation.navigate('CVGenerator')}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <HomeGridItem
              icon="notifications"
              label="إشعاراتي"
              onPress={() => navigation.navigate('UserStack', { screen: 'MyNotifications' })}
            />
            <HomeGridItem
              icon="collections-bookmark"
              label="دوراتي"
              onPress={() => navigation.navigate('UserStack', { screen: 'MyCourses' })}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <HomeGridItem
              icon="how-to-reg"
              label="طلبات التسجيل"
              onPress={() => navigation.navigate('UserStack', { screen: 'MyRegistrationRequests' })}
            />
            <HomeGridItem
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

        <PrimaryBtn
          style={{ alignSelf: 'center', marginTop: 16 }}
          onPress={() => navigation.navigate('AuthStack', { screen: 'SignUp' })}
        >
          <PrimaryText>إنشاء حساب</PrimaryText>
        </PrimaryBtn>

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
  };

  const renderHeaderBlock = () => (
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
          customAnimation={(value: number) => {
            'worklet';
            const distance = Math.abs(value);
            const opacity = interpolate(distance, [0, 0.5, 1], [1, 0.6, 0], Extrapolate.CLAMP);
            const scale = interpolate(distance, [0, 1], [1, 0.98], Extrapolate.CLAMP);
            return { opacity, transform: [{ scale }] };
          }}
          onConfigurePanGesture={gesture => {
            'worklet';
            gesture.activeOffsetX([-20, 20]);
            gesture.failOffsetY([-10, 10]);
          }}
          renderItem={({ item }) => (
            <SlideTouchable
              activeOpacity={0.9}
              onPress={() => {
                if (item.link) {
                  openLinkSafe(item.link);
                }
              }}
              style={{ width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#e9e7e0' }}
            >
              <SlideImage source={{ uri: item.image }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            </SlideTouchable>
          )}
          data={sliderItems}
        />
      ) : null}

      {renderAuthSection()}
    </View>
  );

  const renderCourseSections = () => {
    if (loading) {
      return null;
    }

    if (!courseSections.length) {
      return <EmptyCoursesText>لا توجد دورات حالية أو قادمة لعرضها حاليًا</EmptyCoursesText>;
    }

    return courseSections.map(section => (
      <CourseSectionBlock key={section.key}>
        {renderCourseGrid(section)}
      </CourseSectionBlock>
    ));
  };

  const renderFooterSocial = () => (
    <SocialSection>
      <SocialTitle>تابعنا على مواقع التواصل</SocialTitle>
      <IconRow>
        {HOME_EXTERNAL_LINKS.map(link => (
          <SocialIcon
            key={link.id}
            activeOpacity={0.85}
            accessibilityRole="link"
            accessibilityLabel={link.label}
            onPress={() => openLinkSafe(link.url)}
          >
            <Icon name={link.iconName} size={24} color="#eceadf" />
          </SocialIcon>
        ))}
      </IconRow>
    </SocialSection>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {renderHeaderBlock()}

          <CoursesHeader>
            <SectionTitle>يحدث في تنامي</SectionTitle>
          </CoursesHeader>
          {renderCourseSections()}
          {renderFooterSocial()}
        </ScrollView>

        {loading ? <AppLoading overlay /> : null}
      </Screen>

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
