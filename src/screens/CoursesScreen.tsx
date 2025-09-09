// CoursesScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components/native';
import { ActivityIndicator, Alert, Dimensions, FlatList, I18nManager, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24;

const Container = styled.View`
  flex: 1;
  background-color: #eceadf;
  padding: 16px;
`;

const Card = styled.TouchableOpacity`
  background-color: #eceadf;
  width: ${CARD_WIDTH}px;
  height: 120px;
  border-radius: 12px;
  margin: 8px;
  justify-content: center;
  align-items: center;
`;

const CardIcon = styled(Icon)`
  color: #0f4f30;
  font-size: 28px;
  margin-bottom: 8px;
`;

const CardLabel = styled.Text`
  color: #0f4f30;
  font-size: 14px;
  text-align: center;
  font-family: 'NotoKufiArabic-Regular';
`;

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

const BASE = 'http://tanamitrain.com/tanamiAdmin';
const PACKAGES_URL = `${BASE}/api/mobile-app/packages-with-courses`;

/* simple icon chooser by keywords (ar/en) */
const pickIcon = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('nlp') || t.includes('البرمجة اللغوية') || t.includes('العقل')) return 'lightbulb';
  if (t.includes('تربية') || t.includes('ذوي الاحتياجات') || t.includes('special')) return 'accessible-icon';
  if (t.includes('تواصل') || t.includes('جسد') || t.includes('لغة') || t.includes('communication')) return 'handshake';
  if (t.includes('ادارة') || t.includes('الإدارة') || t.includes('موارد') || t.includes('hr')) return 'briefcase';
  if (t.includes('ابداع') || t.includes('الإبداع')) return 'magic';
  return 'layer-group';
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
        icon: pickIcon((p.name_ar || p.name || p.name_en || '')),
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
          subCourses: item.subCourses,
        })
      }
    >
      <CardIcon name={item.icon} />
      <CardLabel numberOfLines={2}>{item.label}</CardLabel>
    </Card>
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
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111" />}
        ListEmptyComponent={
          <CardLabel style={{ color: '#111', marginTop: 16 }}>لا توجد حزم متاحة حالياً</CardLabel>
        }
      />
    </Container>
  );
};

export default CoursesScreen;
