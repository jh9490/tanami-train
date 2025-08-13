import React from 'react';
import styled from 'styled-components/native';
import { FlatList, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24;

const Container = styled.View`
  flex: 1;
  background-color: #c9912b;
  padding: 16px;
`;

const Card = styled.TouchableOpacity`
  background-color: #111;
  width: ${CARD_WIDTH}px;
  height: 120px;
  border-radius: 12px;
  margin: 8px;
  justify-content: center;
  align-items: center;
`;

const CardIcon = styled(Icon)`
  color: #ffc546;
  font-size: 28px;
  margin-bottom: 8px;
`;

const CardLabel = styled.Text`
  color: #ffc546;
  font-size: 14px;
  text-align: center;
  font-family: 'NotoKufiArabic-Regular';
`;

const courses = [
  {
    id: '1',
    label: 'البرمجة اللغوية والعقل',
    icon: 'lightbulb',
    subCourses: [
      'دبلوم البرمجة اللغوية العصبية (المستوى الأول)',
      'ممارس برمجة لغوية عصبية (المستوى الثاني)',
      'ممارس متقدم في البرمجة اللغوية العصبية (المستوى الثالث)',
      'البرمجة اللغوية العصبية للأطفال',
      'تشبيط العقل',
      'تقنيات الإبداع',
    ],
  },
  {
    id: '2',
    label: 'دورات التربية الخاصة',
    icon: 'accessible-icon',
    subCourses: [
      'مدخل إلى التربية الخاصة',
      'التعامل مع ذوي الاحتياجات الخاصة',
      'مهارات دمج الأطفال ذوي الإعاقة',
    ],
  },
  {
    id: '3',
    label: 'مهارات التواصل ولغة الجسد',
    icon: 'handshake',
    subCourses: [
      'إتقان لغة الجسد',
      'التأثير في الآخرين بالكلمات والحركة',
    ],
  },
  {
    id: '4',
    label: 'الإدارة والموارد البشرية',
    icon: 'briefcase',
    subCourses: [
      'إدارة الأداء',
      'أساسيات الموارد البشرية',
    ],
  },
  // Add more as needed...
];

const CoursesScreen = () => {
  const navigation = useNavigation();

  const renderItem = ({ item }: { item: typeof courses[0] }) => (
    <Card onPress={() =>
      navigation.navigate('SubCourses', {
        title: item.label,
        subCourses: item.subCourses || [],
      })
    }>
      <CardIcon name={item.icon} />
      <CardLabel>{item.label}</CardLabel>
    </Card>
  );

  return (
    <Container>
      <FlatList
        data={courses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </Container>
  );
};

export default CoursesScreen;
