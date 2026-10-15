// CoursesScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components/native';
import { Alert, Dimensions, FlatList, I18nManager, RefreshControl, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import AppLoading from './components/AppLoading';
import { colors } from '../theme/colors';

I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

const Container = styled.View`
  flex: 1;
  background-color: ${colors.cream};
`;

const PageHeader = styled.View`
  align-items: center;
  padding: 26px 20px 24px;
`;

const PageTitle = styled.Text`
  color: ${colors.greenDark};
  font-size: 21px;
  line-height: 34px;
  text-align: center;
  font-family: 'NotoKufiArabic-Bold';
`;

const TitleAccent = styled.View`
  width: 42px;
  height: 4px;
  border-radius: 2px;
  margin-top: 12px;
  background-color: ${colors.gold};
`;

const Card = styled.TouchableOpacity`
  background-color: ${colors.white};
  width: ${CARD_WIDTH}px;
  min-height: 172px;
  border-radius: 16px;
  border-width: 1px;
  border-color: ${colors.cardBorder};
  margin-bottom: 12px;
  padding: 18px 10px 14px;
  justify-content: center;
  align-items: center;
  shadow-color: #143626;
  shadow-offset: 0px 3px;
  shadow-opacity: 0.07;
  shadow-radius: 7px;
  elevation: 2;
`;

const ArtworkTile = styled.View`
  width: 82px;
  height: 82px;
  border-radius: 16px;
  border-width: 1px;
  border-color: #e4e9e4;
  background-color: ${colors.white};
  align-items: center;
  justify-content: center;
  margin-bottom: 13px;
`;

const CardIcon = styled(Icon)`
  color: ${colors.green};
  font-size: 36px;
`;

const CardImage = styled.Image`
  width: 72px;
  height: 72px;
  border-radius: 12px;
`;

const CardLabel = styled.Text`
  color: ${colors.text};
  font-size: 13px;
  line-height: 22px;
  text-align: center;
  font-family: 'NotoKufiArabic-Bold';
`;

const EmptyText = styled.Text`
  color: ${colors.muted};
  font-size: 14px;
  text-align: center;
  margin-top: 24px;
  font-family: 'NotoKufiArabic-Regular';
`;

const styles = StyleSheet.create({
  columns: {
    justifyContent: 'space-between',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

/* ------------------- API types ------------------- */
type ApiCourse = {
  id: number;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
  course_head_lines?: string | null; // HTML
  days?: number | null;
  hours?: number | null;
  cost?: number | null;
  grade?: string | null;
  active?: number;
  package_id: number;
};

type ApiPackage = {
  id: number;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
  image_url?: string | null;
  courses_count: number;
  courses: ApiCourse[];
};

type SubCourseParam = {
  id: number;
  name: string;
  course_head_lines?: string | null;
  days?: number | null;
  hours?: number | null;
};

const BASE = 'https://admin.tanamitrain.com';
const PACKAGES_URL = `${BASE}/api/mobile-app/packages-with-courses`;

const PackageArtwork = ({imageUrl}: {imageUrl?: string | null}) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (!imageUrl || imageFailed) {
    return (
      <ArtworkTile>
        <CardIcon name="image" />
      </ArtworkTile>
    );
  }

  return (
    <ArtworkTile>
      <CardImage
        source={{uri: imageUrl}}
        resizeMode="contain"
        onError={() => setImageFailed(true)}
      />
    </ArtworkTile>
  );
};

const CoursesScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch(PACKAGES_URL);
      const json: ApiPackage[] = await res.json();
      setPackages(Array.isArray(json) ? json : []);
    } catch (e) {
      Alert.alert('خطأ', 'تعذّر تحميل الحزم. تأكد من الاتصال بالإنترنت.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPackages();
  }, [fetchPackages]);

  const data = useMemo(
    () =>
      packages.map((p) => ({
        id: String(p.id),
        label: (p.name_ar || p.name || p.name_en || '').trim(),
        imageUrl: p.image_url?.trim() || null,
        subCourses: (p.courses || []).map<SubCourseParam>((c) => ({
          id: c.id,
          name: (c.name_ar || c.name || c.name_en || '').trim(),
          course_head_lines: c.course_head_lines || '',
          days: c.days ?? null,
          hours: c.hours ?? null,
        })),
      })),
    [packages]
  );

  const renderItem = ({ item }: { item: (typeof data)[number] }) => (
    <Card
      onPress={() =>
        navigation.navigate('SubCourses', {
          title: item.label,
          packageImageUrl: item.imageUrl,
          subCourses: item.subCourses,
        })
      }
    >
      <PackageArtwork imageUrl={item.imageUrl} />
      <CardLabel numberOfLines={2}>{item.label}</CardLabel>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <Container>
        <AppLoading style={{backgroundColor: colors.cream}} />
      </Container>
    );
  }

  return (
    <Container>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={
          <PageHeader>
            <PageTitle>الحقائب التدريبية التي تقدمها تنامي ترين</PageTitle>
            <TitleAccent />
          </PageHeader>
        }
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.gold]} />}
        ListEmptyComponent={
          <EmptyText>لا توجد حزم متاحة حالياً</EmptyText>
        }
      />
    </Container>
  );
};

export default CoursesScreen;
