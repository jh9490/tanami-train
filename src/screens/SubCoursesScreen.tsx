import React, {useCallback, useState} from 'react';
import {FlatList, StyleSheet} from 'react-native';
import styled from 'styled-components/native';
import {useRoute} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/FontAwesome5';
import CourseDialog, {CourseLite} from './components/CourseDialog';
import {useAuth} from '../context/AuthContext';
import {colors} from '../theme/colors';

const ABSTRACT_COVER = require('../assets/subcourses-abstract-cover.png');

type SubCourse = {
  id: number;
  name: string;
  course_head_lines?: string | null;
  days?: number | null;
  hours?: number | null;
};

type RouteParams = {
  title?: string;
  packageImageUrl?: string | null;
  subCourses?: SubCourse[];
};

const Screen = styled.View`
  flex: 1;
  background-color: ${colors.cream};
`;

const Header = styled.View`
  margin-bottom: 28px;
`;

const Cover = styled.ImageBackground`
  height: 170px;
  overflow: hidden;
`;

const HeaderBody = styled.View`
  min-height: 106px;
  padding: 54px 18px 14px;
  background-color: ${colors.white};
  border-bottom-width: 1px;
  border-bottom-color: ${colors.cardBorder};
`;

const PackageImageFrame = styled.View`
  position: absolute;
  top: 112px;
  left: 20px;
  width: 116px;
  height: 116px;
  border-radius: 20px;
  border-width: 5px;
  border-color: ${colors.white};
  background-color: ${colors.white};
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 2;
  elevation: 4;
`;

const PackageImage = styled.Image`
  width: 106px;
  height: 106px;
`;

const PlaceholderIcon = styled(Icon)`
  color: ${colors.green};
  font-size: 44px;
`;

const HeaderTitle = styled.Text`
  color: ${colors.greenDark};
  font-family: 'NotoKufiArabic-Bold';
  font-size: 19px;
  line-height: 30px;
  text-align: center;
`;

const CourseCard = styled.Pressable`
  width: 48.3%;
  min-height: 138px;
  padding: 18px 12px;
  margin-bottom: 12px;
  border-radius: 16px;
  border-width: 1px;
  border-color: ${colors.cardBorder};
  background-color: ${colors.white};
  align-items: center;
  justify-content: center;
  shadow-color: #143626;
  shadow-offset: 0px 3px;
  shadow-opacity: 0.07;
  shadow-radius: 7px;
  elevation: 2;
`;

const CourseIconCircle = styled.View`
  width: 46px;
  height: 46px;
  border-radius: 23px;
  align-items: center;
  justify-content: center;
  background-color: #edf3ed;
  margin-bottom: 12px;
`;

const CourseText = styled.Text`
  color: ${colors.text};
  font-family: 'NotoKufiArabic-Bold';
  font-size: 13px;
  line-height: 22px;
  text-align: center;
`;

const EmptyText = styled.Text`
  color: ${colors.muted};
  font-family: 'NotoKufiArabic-Regular';
  font-size: 14px;
  text-align: center;
  margin-top: 24px;
`;

const styles = StyleSheet.create({
  root: {flex: 1},
  listContent: {paddingHorizontal: 16, paddingBottom: 28},
  columns: {justifyContent: 'space-between'},
});

const toCourseLite = (course: SubCourse): CourseLite => ({
  id: String(course.id),
  title: course.name || '—',
  image: null,
  headLines: course.course_head_lines || '',
  nameAr: course.name || null,
  days: course.days ?? null,
  hours: course.hours ?? null,
  date: null,
  endDate: null,
  live: null,
  cost: null,
});

const PackageThumbnail = ({imageUrl}: {imageUrl?: string | null}) => {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return <PlaceholderIcon name="image" />;
  }

  return (
    <PackageImage
      source={{uri: imageUrl}}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
};

const SubCoursesScreen: React.FC = () => {
  const route = useRoute();
  const {title = 'الحقيبة التدريبية', packageImageUrl, subCourses = []} =
    (route.params as RouteParams | undefined) ?? {};
  const {token, isAuthenticated} = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<CourseLite | null>(null);

  const openDetails = useCallback((course: SubCourse) => {
    setSelected(toCourseLite(course));
    setDialogOpen(true);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Screen>
        <FlatList
          data={subCourses}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <Header>
                <Cover source={ABSTRACT_COVER} resizeMode="cover" />
                <PackageImageFrame>
                  <PackageThumbnail imageUrl={packageImageUrl} />
                </PackageImageFrame>
                <HeaderBody>
                  <HeaderTitle numberOfLines={2}>{title}</HeaderTitle>
                </HeaderBody>
              </Header>
            </>
          }
          renderItem={({item}) => (
            <CourseCard onPress={() => openDetails(item)}>
              <CourseIconCircle>
                <Icon name="book-open" size={20} color={colors.green} />
              </CourseIconCircle>
              <CourseText numberOfLines={3}>{item.name}</CourseText>
            </CourseCard>
          )}
          ListEmptyComponent={
            <EmptyText>لا توجد دورات ضمن هذه الحزمة</EmptyText>
          }
        />
      </Screen>

      <CourseDialog
        visible={dialogOpen}
        course={selected}
        onClose={() => setDialogOpen(false)}
        isAuthenticated={isAuthenticated}
        token={token}
        enabledTabs={['head', 'details']}
        durationOnlyDetails
      />
    </GestureHandlerRootView>
  );
};

export default SubCoursesScreen;
