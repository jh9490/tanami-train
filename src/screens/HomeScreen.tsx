import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert,
  I18nManager,
  ImageBackground,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import styled from 'styled-components/native';
import Carousel from 'react-native-reanimated-carousel';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';

import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { openLinkSafe } from '../util/Linker';
import PlaceholderPoster from './components/PlaceholderPoster';
import CourseDialog, { CourseLite } from './components/CourseDialog';
import AppLoading from './components/AppLoading';
import ThemedBackground from './components/ThemedBackground';
import { colors as themeColors } from '../theme/colors';

I18nManager.forceRTL(true);

const PAGE_PADDING = 16;
const COLORS = {
  green: '#0f4f30',
  greenDark: '#0c2a20',
  gold: '#cbae82',
  sand: '#fff8ef',
  cream: '#fbf3e7',
  sage: '#e8f1ea',
  tile: '#f3f4f2',
  border: '#e6e2d8',
  ink: '#151515',
  muted: '#6b7280',
  white: '#ffffff',
};

const BASE = 'http://tanamitrain.com/tanamiAdmin';
const SLIDERS_URL = `${BASE}/api/mobile-app/sliders`;
const ACTIVITIES_URL = `${BASE}/api/mobile-app/activities`;

type SliderItem = { id: string; image: string; link?: string; title?: string; subtitle?: string; cta?: string };
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
`;

const HomeSection = styled.View`
  margin-top: 18px;
  position: relative;
`;

const HeroSection = styled.View`
  position: relative;
  overflow: hidden;
  background-color: ${COLORS.greenDark};
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
`;

const SlideTouchable = styled.TouchableOpacity<{ h: number }>`
  width: 100%;
  height: ${({ h }) => h}px;
  overflow: hidden;
  background-color: transparent;
`;

const SlideBg = styled(ImageBackground)<{ h: number }>`
  width: 100%;
  height: ${({ h }) => h}px;
`;

const HeroDots = styled.View`
  position: absolute;
  left: ${PAGE_PADDING}px;
  bottom: 18px;
  flex-direction: row;
  align-items: center;
  z-index: 3;
`;

const HeroDot = styled.View<{ active: boolean }>`
  width: ${({ active }) => (active ? 28 : 8)}px;
  height: 8px;
  border-radius: 999px;
  background-color: ${({ active }) => (active ? COLORS.white : 'rgba(255, 255, 255, 0.38)')};
  margin-right: 5px;
`;

const AuthCard = styled.View`
  margin: 14px ${PAGE_PADDING}px 4px;
  background: rgba(255, 248, 239, 0.12);
  border-radius: 24px;
  padding: 18px;
  border-width: 1px;
  border-color: rgba(255, 248, 239, 0.16);
  shadow-color: #000;
  shadow-opacity: 0.12;
  shadow-radius: 14px;
  shadow-offset: 0px 6px;
  elevation: 4;
`;

const AuthTitle = styled.Text`
  font-size: 18px;
  line-height: 28px;
  color: ${themeColors.cream};
  font-family: 'NotoKufiArabic-Bold';
  text-align: center;
`;

const AuthSubtitle = styled.Text`
  font-size: 12px;
  line-height: 20px;
  color: rgba(255, 248, 239, 0.78);
  text-align: center;
  margin-top: 4px;
  font-family: 'NotoKufiArabic-Regular';
`;

const GridItemWrap = styled.TouchableOpacity`
  background-color: rgba(255, 248, 239, 0.12);
  border-radius: 15px;
  border-width: 1px;
  border-color: rgba(255, 248, 239, 0.14);
  min-height: 92px;
  padding-vertical: 12px;
  align-items: center;
  justify-content: center;
  flex: 1;
  margin: 6px;
`;

const GridItemLabel = styled.Text`
  margin-top: 8px;
  color: rgba(255, 248, 239, 0.88);
  font-family: 'NotoKufiArabic-Bold';
  font-size: 12px;
`;

const PrimaryBtn = styled.TouchableOpacity`
  background: ${themeColors.gold};
  padding: 11px 18px;
  border-radius: 999px;
  min-width: 142px;
  align-items: center;
`;

const PrimaryText = styled.Text`
  color: ${themeColors.greenDarker};
  font-size: 13px;
  font-family: 'NotoKufiArabic-Bold';
`;

const CoursesHeader = styled.View`
  padding: 0 ${PAGE_PADDING}px 10px;
`;

const SectionTitle = styled.Text`
  font-size: 19px;
  line-height: 30px;
  color: ${themeColors.cream};
  font-family: 'NotoKufiArabic-Bold';
  text-align: center;
  writing-direction: rtl;
`;

const CourseSectionBlock = styled.View`
  margin-top: 2px;
  align-items: center;
`;

const RadarStaticRow = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: center;
  padding-horizontal: ${PAGE_PADDING}px;
`;

const EmptyCoursesText = styled.Text`
  text-align: center;
  color: rgba(255, 248, 239, 0.78);
  margin-top: 10px;
  padding: 0 ${PAGE_PADDING}px;
  font-family: 'NotoKufiArabic-Regular';
`;

const RadarCard = styled.TouchableOpacity<{ w: number; h: number }>`
  width: ${({ w }) => w}px;
  height: ${({ h }) => h}px;
  border-radius: 0px;
  overflow: hidden;
  background-color: #eee6dc;
  margin-horizontal: 5px;
`;

const RadarImageBg = styled(ImageBackground)`
  width: 100%;
  height: 100%;
`;

const RadarPill = styled.View`
  position: absolute;
  top: 14px;
  align-self: center;
  min-width: 92px;
  max-width: 86%;
  height: 36px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.88);
  align-items: center;
  justify-content: center;
  padding-horizontal: 14px;
`;

const RadarPillText = styled.Text`
  color: ${COLORS.ink};
  font-family: 'NotoKufiArabic-Bold';
  font-size: 12px;
`;

const RadarTitle = styled.Text`
  color: ${COLORS.white};
  font-family: 'NotoKufiArabic-Bold';
  font-size: 17px;
  line-height: 27px;
  text-align: center;
`;

const RadarMeta = styled.Text`
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.86);
  font-family: 'NotoKufiArabic-Regular';
  font-size: 11px;
  line-height: 18px;
  text-align: center;
`;

const SocialSection = styled.View`
  margin-top: 24px;
  align-items: center;
  margin-bottom: 12px;
`;

const SocialTitle = styled.Text`
  font-size: 16px;
  font-family: 'NotoKufiArabic-Regular';
  color: rgba(255, 248, 239, 0.82);
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
  background-color: rgba(255, 248, 239, 0.12);
  border-width: 1px;
  border-color: rgba(255, 248, 239, 0.16);
  justify-content: center;
  align-items: center;
  margin: 6px 8px;
`;

const toAbs = (rel?: string | null) => (rel ? `${BASE}${rel}` : undefined);

const HomeGridItem = ({ icon, label, onPress }: HomeGridItemProps) => (
  <GridItemWrap onPress={onPress} activeOpacity={0.8}>
    <MaterialIcon name={icon} size={24} color={themeColors.gold} />
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
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthenticated, displayName, token } = useAuth();

  const happeningItems = useMemo(
    () => [...courses.current, ...courses.upcoming].slice(0, 12),
    [courses],
  );
  const heroHeight = Math.max(245, Math.min(330, Math.round(windowWidth * 0.68)));
  const compactRadarCardW = Math.floor((windowWidth - PAGE_PADDING * 2 - 12) / 2);
  const carouselRadarCardW = Math.max(210, Math.min(270, Math.round(windowWidth * 0.68)));
  const radarCardW = happeningItems.length <= 2 ? compactRadarCardW : carouselRadarCardW;
  const radarCardH = Math.round(radarCardW * 1.34);

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
          return {
            id: String(slider.id),
            image,
            link: slider.link ?? undefined,
            title: slider.title || slider.name || slider.headline || 'تنامي ترين',
            subtitle: slider.subtitle || slider.description || 'رحلتك التعليمية تبدأ من هنا',
            cta: slider.cta || slider.button_text || 'اكتشف المزيد',
          };
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

  const getCourseStatusLabel = (item: CourseLite) => {
    if (item.live) return 'مباشر';
    const isCurrent = courses.current.some(course => course.id === item.id);
    return isCurrent ? 'حاليًا' : 'قادم';
  };

  const renderRadarCard = (item: CourseLite) => {
    const title = item.nameAr || item.title || '—';
    const metaParts = [item.date, item.days ? `${item.days} أيام` : null].filter(Boolean);

    return (
      <RadarCard
        key={item.id}
        w={radarCardW}
        h={radarCardH}
        activeOpacity={0.9}
        onPress={() => {
          setSelectedCourse(item);
          setDetailsOpen(true);
        }}
      >
        {item.image ? (
          <RadarImageBg source={{ uri: item.image }} resizeMode="cover">
            <LinearGradient
              colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.72)']}
              style={{ flex: 1, justifyContent: 'space-between', padding: 14 }}
            >
              <RadarPill pointerEvents="none">
                <RadarPillText numberOfLines={1}>{getCourseStatusLabel(item)}</RadarPillText>
              </RadarPill>
              <View />
              <View pointerEvents="none">
                <RadarTitle numberOfLines={2}>{title}</RadarTitle>
                {metaParts.length ? <RadarMeta numberOfLines={1}>{metaParts.join(' • ')}</RadarMeta> : null}
              </View>
            </LinearGradient>
          </RadarImageBg>
        ) : (
          <View style={{ flex: 1 }}>
            <PlaceholderPoster width={radarCardW} height={radarCardH} />
            <RadarPill pointerEvents="none">
              <RadarPillText numberOfLines={1}>{getCourseStatusLabel(item)}</RadarPillText>
            </RadarPill>
          </View>
        )}
      </RadarCard>
    );
  };

  const renderActionRows = () => (
    <>
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
          icon="live-tv"
          label="احضر أونلاين"
          onPress={() => navigation.navigate('UserStack', { screen: 'OnlineCourses' })}
        />
        <HomeGridItem
          icon="verified"
          label="تحقق من شهادة"
          onPress={() => navigation.navigate('UserStack', { screen: 'VerifyCertificateScreen' })}
        />
      </View>
    </>
  );

  const renderAuthSection = () => {
    if (isAuthenticated) {
      return (
        <AuthCard>
          <AuthTitle>أهلًا، {displayName ?? 'مستخدم'}</AuthTitle>
          <AuthSubtitle>تابع رحلتك مع تنامي من مكان واحد</AuthSubtitle>

          {renderActionRows()}
        </AuthCard>
      );
    }

    return (
      <AuthCard>
        <AuthTitle>ابدأ رحلتك مع تنامي</AuthTitle>
        <AuthSubtitle>سجّل الآن للوصول إلى دوراتك، شهاداتك، وإشعاراتك بسهولة</AuthSubtitle>

        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <HomeGridItem
            icon="school"
            label="الدورات"
            onPress={() => navigation.navigate('MainTabs')}
          />
          <HomeGridItem
            icon="verified"
            label="الشهادات"
            onPress={() => navigation.navigate('UserStack', { screen: 'VerifyCertificateScreen' })}
          />
        </View>

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
            color: themeColors.gold,
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

  const renderHeroSlider = () => {
    if (!sliderItems.length) {
      return null;
    }

    return (
      <HeroSection>
        <Carousel<SliderItem>
          width={windowWidth}
          height={heroHeight}
          loop
          autoPlay
          autoPlayInterval={6000}
          scrollAnimationDuration={900}
          windowSize={5}
          onSnapToItem={index => setActiveHeroIndex(index)}
          onConfigurePanGesture={gesture => {
            'worklet';
            gesture.activeOffsetX([-20, 20]);
            gesture.failOffsetY([-10, 10]);
          }}
          renderItem={({ item }) => (
            <SlideTouchable
              h={heroHeight}
              activeOpacity={0.9}
              onPress={() => {
                if (item.link) {
                  openLinkSafe(item.link);
                }
              }}
            >
              <SlideBg source={{ uri: item.image }} resizeMode="contain" h={heroHeight}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.03)', 'rgba(0,0,0,0.16)']}
                  style={{ flex: 1 }}
                />
              </SlideBg>
            </SlideTouchable>
          )}
          data={sliderItems}
        />

        {sliderItems.length > 1 ? (
          <HeroDots pointerEvents="none">
            {sliderItems.map((item, index) => (
              <HeroDot key={item.id} active={index === activeHeroIndex} />
            ))}
          </HeroDots>
        ) : null}
      </HeroSection>
    );
  };

  const renderHappeningSection = () => {
    if (loading) {
      return null;
    }

    if (!happeningItems.length) {
      return <EmptyCoursesText>لا توجد دورات حالية أو قادمة لعرضها حاليًا</EmptyCoursesText>;
    }

    if (happeningItems.length <= 2) {
      return (
        <CourseSectionBlock>
          <RadarStaticRow>
            {happeningItems.map(item => (
              <View key={item.id} style={{ marginHorizontal: 3 }}>
                {renderRadarCard(item)}
              </View>
            ))}
          </RadarStaticRow>
        </CourseSectionBlock>
      );
    }

    return (
      <CourseSectionBlock>
        <Carousel<CourseLite>
          width={windowWidth}
          height={radarCardH}
          style={{ width: windowWidth }}
          loop={happeningItems.length > 2}
          autoPlay={happeningItems.length > 2}
          autoPlayInterval={4700}
          scrollAnimationDuration={1600}
          data={happeningItems}
          onConfigurePanGesture={gesture => {
            'worklet';
            gesture.activeOffsetX([-20, 20]);
            gesture.failOffsetY([-12, 12]);
          }}
          renderItem={({ item }) => (
            <View style={{ width: windowWidth, alignItems: 'center' }}>
              {renderRadarCard(item)}
            </View>
          )}
        />
      </CourseSectionBlock>
    );
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
            <Icon name={link.iconName} size={24} color={themeColors.gold} />
          </SocialIcon>
        ))}
      </IconRow>
    </SocialSection>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedBackground>
        <Screen>
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={themeColors.gold}
                colors={[themeColors.gold]}
              />
            }
            contentContainerStyle={{ paddingBottom: 32 }}
            style={{ zIndex: 1 }}
          >
            {renderHeroSlider()}

            {renderAuthSection()}

            <HomeSection>
              <CoursesHeader>
                <SectionTitle>يحدث في تنامي</SectionTitle>
              </CoursesHeader>
              {renderHappeningSection()}
            </HomeSection>
            {renderFooterSocial()}
          </ScrollView>

          {loading ? <AppLoading overlay /> : null}
        </Screen>
      </ThemedBackground>

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
