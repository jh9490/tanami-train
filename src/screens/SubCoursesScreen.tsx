import React, { useRef, useMemo, useCallback, useState } from 'react';
import { FlatList, Pressable, View, Text, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { useRoute } from '@react-navigation/native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Container = styled.View`
  flex: 1;
  background-color: #fff;
  padding: 16px;
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

const SubCoursesScreen = () => {
  const route = useRoute();
  const { title, subCourses } = route.params as {
    title: string;
    subCourses: string[];
  };

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['30%', '60%'], []);

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const handleOpenSheet = useCallback((courseTitle: string) => {
    setSelectedCourse(courseTitle);
    bottomSheetRef.current?.snapToIndex(1); // open to 60%
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Container>
        <FlatList
          data={subCourses}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleOpenSheet(item)}>
              <CourseBox>
                <CourseText>{item}</CourseText>
              </CourseBox>
            </Pressable>
          )}
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
          <Text style={styles.sheetTitle}>{selectedCourse}</Text>
          <Text style={styles.sheetText}>هنا بعض التفاصيل حول الدورة أو المحتوى الذي اخترته.</Text>
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
    marginBottom: 12,
  },
  sheetText: {
    fontSize: 16,
    lineHeight: 22,
  },
});

export default SubCoursesScreen;
