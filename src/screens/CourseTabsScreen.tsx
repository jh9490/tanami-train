import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

function DetailsTab({ route }: any) {
  const title = route.params?.title ?? 'الدورة';
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff1e2', padding: 12 }}>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, color: '#111' }}>{title}</Text>
      <Text style={{ fontFamily: 'NotoKufiArabic-Regular', fontSize: 14, color: '#444',  lineHeight: 22, marginTop: 8 }}>
        هذه تفاصيل الدورة (نص تجريبي). أضف الأهداف، خطة المحتوى، المخرجات، والمتطلبات.
      </Text>
    </ScrollView>
  );
}

function GalleryTab() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff1e2', padding: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' }}>
        {[1,2,3,4,5,6].map((i) => (
          <Image key={i} source={{ uri: 'https://picsum.photos/200?random=' + i }} style={{ width: 110, height: 110, borderRadius: 12 }} />
        ))}
      </View>
    </ScrollView>
  );
}

function LibraryTab() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff1e2', padding: 12 }}>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: '#111' }}>المكتبة</Text>
      <Text style={{ fontFamily: 'NotoKufiArabic-Regular', fontSize: 13, color: '#444', marginTop: 8 }}>
        روابط وملفات (PDF/فيديو) خاصة بالدورة – محتوى تجريبي.
      </Text>
    </ScrollView>
  );
}

function CertificateTab() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, color: '#111' }}>شهادتي</Text>
      <Text style={{ fontFamily: 'NotoKufiArabic-Regular', fontSize: 13, color: '#444', marginTop: 6 }}>
        ستظهر الشهادة هنا عند توفرها.
      </Text>
    </View>
  );
}

export default function CourseTabsScreen({ route }: any) {
  const { courseId, title } = route.params ?? {};
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: { backgroundColor: '#0f4f30' },
        tabBarStyle: { backgroundColor: '#eceadf' },
        tabBarLabelStyle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 },
      }}
    >
      <Tab.Screen name="Details" component={DetailsTab} options={{ title: 'التفاصيل' }} initialParams={{ title }} />
      <Tab.Screen name="Gallery" component={GalleryTab} options={{ title: 'المعرض' }} />
      <Tab.Screen name="Library" component={LibraryTab} options={{ title: 'المكتبة' }} />
      <Tab.Screen name="Certificate" component={CertificateTab} options={{ title: 'الشهادة' }} />
    </Tab.Navigator>
  );
}
