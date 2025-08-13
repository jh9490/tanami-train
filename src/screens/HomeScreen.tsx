import React, { useState } from 'react';
import { Dimensions, I18nManager } from 'react-native';
import styled from 'styled-components/native';
import Carousel from 'react-native-reanimated-carousel';
import { Linking } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
// Force RTL (you can make this dynamic later)
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24;

const Container = styled.ScrollView`
  flex: 1;
  background-color: #fff8e5;
`;

const SlideImage = styled.Image`
  width: 100%;
  height: 200px;
  border-radius: 10px;
  margin: 16px 0;
`;

const FilterContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-bottom: 16px;
  margin-top: 10px ;
`;

const FilterButton = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${({ active }) => (active ? '#c9912b' : '#eee')};
  padding: 10px 16px;
  margin: 0 8px;
  border-radius: 10px;
`;

const FilterText = styled.Text<{ active: boolean }>`
  color: ${({ active }) => (active ? '#fff' : '#333')};
  font-size: 14px;
  font-family: 'NotoKufiArabic-Regular';
`;

const Grid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  padding-bottom: 32px;
`;

const Card = styled.TouchableOpacity`
  background-color: #343a40;
  width: ${CARD_WIDTH}px;
  height: 180px;
  margin: 8px;
  border-radius: 12px;

  justify-content: flex-start;
  align-items: center;
`;

const CardImage = styled.Image`
  width: 100%;
  height: 140px;
  border-radius: 8px;
  margin-bottom: 10px;
`;

const CardLabel = styled.Text`
  color: #fff ;
  font-size: 13px;
  text-align: center;
  font-family: 'NotoKufiArabic-Regular';
`;

const SocialSection = styled.View`
  margin-top: 24px;
  align-items: center;
`;

const SocialTitle = styled.Text`
  font-size: 16px;
  font-family: 'NotoKufiArabic-Regular';
  color: #c9912b;
  margin-bottom: 12px;
`;

const IconRow = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const SocialIcon = styled.TouchableOpacity`
  background-color: #000;
  padding: 12px;
  border-radius: 30px;
  margin: 0 8px;
`;

// Replace these with your actual assets
const sliderImages = [
  require('../assets/slider_1.jpg'),
  require('../assets/slider_2.jpg'),
  require('../assets/slider_3.jpg'),
];

const courseList = {
  current: [
    {
      id: '1',
      title: 'مهارات سوق العمل',
      image: require('../assets/image1.jpg'),
    },
    {
      id: '2',
      title: 'نادي التغيير الإيجابي',
      image: require('../assets/image2.jpg'),
    },
    {
        id: '5',
        title: 'نادي التغيير الإيجابي',
        image: require('../assets/image2.jpg'),
      },
      {
        id: '6',
        title: 'نادي التغيير الإيجابي',
        image: require('../assets/image2.jpg'),
      },
  ],
  upcoming: [
    {
      id: '3',
      title: 'دبلوم التربية الخاصة المهني',
      image: require('../assets/image3.jpg'),
    },
    {
      id: '4',
      title: 'إعداد مدرب معتمد',
      image: require('../assets/image4.jpg'),
    },
    {
        id: '7',
        title: 'نادي التغيير الإيجابي',
        image: require('../assets/image2.jpg'),
      },
      {
        id: '8',
        title: 'نادي التغيير الإيجابي',
        image: require('../assets/image2.jpg'),
      },
  ],
};

const HomeScreen = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming'>('current');

  return (
    <Container>
      {/* Image Slider */}
      <Carousel
        width={width}
        height={200}
        autoPlay
        loop
        data={sliderImages}
        scrollAnimationDuration={1000}
        renderItem={({ item }) => <SlideImage source={item} resizeMode="cover" />}
      />

      {/* Filter Tabs */}
      <FilterContainer>
        <FilterButton active={activeTab === 'current'} onPress={() => setActiveTab('current')}>
          <FilterText active={activeTab === 'current'}>الدورات الحالية</FilterText>
        </FilterButton>
        <FilterButton active={activeTab === 'upcoming'} onPress={() => setActiveTab('upcoming')}>
          <FilterText active={activeTab === 'upcoming'}>الدورات القادمة</FilterText>
        </FilterButton>
      </FilterContainer>

      {/* Grid of Courses */}
      <Grid>
        {courseList[activeTab].map((course) => (
          <Card key={course.id} onPress={() => console.log('Open course:', course.title)}>
            <CardImage source={course.image} resizeMode="cover" />
            <CardLabel>{course.title}</CardLabel>
          </Card>
        ))}
      </Grid>

      <SocialSection>
  <SocialTitle>تابعنا على مواقع التواصل</SocialTitle>
  <IconRow>
    <SocialIcon onPress={() => Linking.openURL('https://www.instagram.com')}>
      <Icon name="instagram" size={24} color="#fff" />
    </SocialIcon>
    <SocialIcon onPress={() => Linking.openURL('https://wa.me/971000000')}>
      <Icon name="whatsapp" size={24} color="#fff" />
    </SocialIcon>
    <SocialIcon onPress={() => Linking.openURL('https://www.tiktok.com')}>
      <Icon name="music" size={24} color="#fff" />
    </SocialIcon>
    <SocialIcon onPress={() => Linking.openURL('https://www.youtube.com')}>
      <Icon name="youtube" size={24} color="#fff" />
    </SocialIcon>
  </IconRow>
</SocialSection>
    </Container>
  );
};

export default HomeScreen;
