// SubCoursesScreen.tsx
import React, { useRef, useMemo, useCallback, useState } from 'react';
import { FlatList, Pressable, View, Text, StyleSheet, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { useRoute } from '@react-navigation/native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CourseDetailsSheet from './sheets/CourseDetailsSheet';

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

const Container = styled.View`
  flex: 1;
  background-color: #eceadf;
  padding: 16px;
`;

const HeaderTitle = styled.Text`
  color: #111;
  font-family: 'NotoKufiArabic-Regular';
  font-size: 18px;
  text-align: center;
  margin-bottom: 8px;
`;

const CourseBox = styled.View`
  background-color: #111;
  border-radius: 12px;
  padding: 12px;
  margin: 8px 0;
`;

const CourseText = styled.Text`
  color: #ffc546;
  font-family: 'NotoKufiArabic-Regular';
  font-size: 16px;
  text-align: center;
`;

// very light HTML → plain text (no extra libs)
const htmlToText = (html?: string | null) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

const SubCoursesScreen: React.FC = () => {
  const route = useRoute();
  const { title, subCourses } = route.params as RouteParams;

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['30%', '65%'], []);

  const [selectedCourse, setSelectedCourse] = useState<SubCourse | null>(null);

  const handleOpenSheet = useCallback((course: SubCourse) => {
    setSelectedCourse(course);
    bottomSheetRef.current?.snapToIndex(1); // open to 65%
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Container>
        <HeaderTitle>{title}</HeaderTitle>

        <FlatList
          data={subCourses}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleOpenSheet(item)}>
              <CourseBox>
                <CourseText numberOfLines={2}>{item.name}</CourseText>
              </CourseBox>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 16 }}>لا توجد دورات ضمن هذه الحزمة</Text>
          }
        />
      </Container>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => setSelectedCourse(null)}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>
            {selectedCourse?.name ?? ''}
          </Text>

          {!!selectedCourse && (
            <View style={styles.metaRow}>
              {selectedCourse.days != null && (
                <Text style={styles.metaItem}>الأيام: {selectedCourse.days}</Text>
              )}
              {selectedCourse.hours != null && (
                <Text style={styles.metaItem}>الساعات: {selectedCourse.hours}</Text>
              )}
            </View>
          )}

          {selectedCourse ? (
            <CourseDetailsSheet
              title={""}
              headLines={selectedCourse.course_head_lines}
              maxHeight={360}   // so it scrolls nicely inside the sheet
            />
          ) : null}
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    padding: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    fontSize: 14,
  },
  sheetText: {
    fontSize: 16,
    lineHeight: 22,

  },
});

export default SubCoursesScreen;
