import React, { useState, useCallback } from 'react';
import { FlatList, Pressable, Text } from 'react-native';
import styled from 'styled-components/native';
import { useRoute } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CourseDialog, { CourseLite } from './components/CourseDialog';
import { useAuth } from '../context/AuthContext';
import ThemedBackground from './components/ThemedBackground';
import { colors } from '../theme/colors';

type SubCourse = {
  id: number;
  name: string;
  course_head_lines?: string | null; // HTML
  days?: number | null;
  hours?: number | null;
};

type RouteParams = {
  title: string;
  subCourses: SubCourse[];
};

const Container = styled(ThemedBackground)`
  flex: 1;
  padding: 16px;
`;

const HeaderTitle = styled.Text`
  color: ${colors.cream};
  font-family: 'NotoKufiArabic-Regular';
  font-size: 18px;
  text-align: center;
  margin-bottom: 8px;
`;

const CourseBox = styled.View`
  background-color: rgba(255, 248, 239, 0.12);
  border-radius: 12px;
  border-width: 1px;
  border-color: rgba(255, 248, 239, 0.16);
  padding: 12px;
  margin: 8px 0;
`;

const CourseText = styled.Text`
  color: #cbae82;
  font-family: 'NotoKufiArabic-Regular';
  font-size: 16px;
  text-align: center;
`;

// Map SubCourse → CourseLite for the dialog
const toCourseLite = (s: SubCourse): CourseLite => ({
  id: String(s.id),
  title: s.name || '—',
  image: null,
  headLines: s.course_head_lines || '',
  nameAr: s.name || null,
  days: s.days ?? null,
  hours: s.hours ?? null,
  date: null,
  endDate: null,
  live: null,
  cost: null,
});

const SubCoursesScreen: React.FC = () => {
  const route = useRoute();
  const { title, subCourses } = route.params as RouteParams;

  const { token, isAuthenticated } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<CourseLite | null>(null);

  const openDetails = useCallback((s: SubCourse) => {
    setSelected(toCourseLite(s));
    setDialogOpen(true);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Container>
        <HeaderTitle>{title}</HeaderTitle>

        <FlatList
          data={subCourses}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable onPress={() => openDetails(item)}>
              <CourseBox>
                <CourseText numberOfLines={2}>{item.name}</CourseText>
              </CourseBox>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 16, color: colors.cream }}>لا توجد دورات ضمن هذه الحزمة</Text>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </Container>

      {/* Reuse dialog, but show ONLY headlines tab */}
      <CourseDialog
        visible={dialogOpen}
        course={selected}
        onClose={() => setDialogOpen(false)}
        isAuthenticated={isAuthenticated}
        token={token}
        enabledTabs={['head']}   // 👈 headlines-only
      />
    </GestureHandlerRootView>
  );
};

export default SubCoursesScreen;
