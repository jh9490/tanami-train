import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { I18nManager } from 'react-native';
// Screens
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import GalleryScreen from '../screens/GalleryScreen';
import SubCoursesScreen from '../screens/SubCoursesScreen';
import VerifyCertificateScreen from '../screens/VerifyCertificateScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import OurLocationScreen from '../screens/OurLocationScreen';

// Hamburger component
const HeaderLeftHamburger = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity onPress={() => navigation.openDrawer()} 
       style={{
      marginRight: 15,
      transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }], // ✅ Mirror only the icon if RTL
    }}>
      <Icon name="menu" size={28} color="#ffc546" />
    </TouchableOpacity>
  );
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Tabs with NO headers (headerShown: false)
const MainTabs = () => {
  const navigation = useNavigation();

  const getHeaderTitle = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return 'الرئيسية';
      case 'Courses':
        return 'الدورات';
      case 'Gallery':
        return 'المعرض';
      default:
        return 'تنامي';
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName =
            route.name === 'Home' ? 'home' : route.name === 'Courses' ? 'book' : 'image';
          return <Icon name={iconName} size={size} color={color} />;
        },
        headerShown: true,
        headerTitle: getHeaderTitle(route.name),
        headerStyle: { backgroundColor: '#000' },
        headerTitleStyle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 18 },
        headerTintColor: '#ffc546',
        headerTitleAlign: 'center',
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginRight: 15 }}>
            <Icon name="menu" size={28} color="#ffc546" />
          </TouchableOpacity>
        ),
        headerRight: () => null, // ✅ Remove left hamburger completely
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ccc',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
          fontFamily: 'NotoKufiArabic-Bold',
        },
        tabBarActiveTintColor: '#ffc546',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'الرئيسية' }} />
      <Tab.Screen name="Courses" component={CoursesScreen} options={{ tabBarLabel: 'الدورات' }} />
      <Tab.Screen name="Gallery" component={GalleryScreen} options={{ tabBarLabel: 'المعرض' }} />
    </Tab.Navigator>
  );
};


// Drawer with shared header style and hamburger
const MainDrawer = () => (
  <Drawer.Navigator
    screenOptions={({ route }) => ({
      drawerType: 'slide',
      drawerStyle: { backgroundColor: '#fff', width: 250 },
      drawerLabelStyle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 16 },
      headerShown: route.name !== 'الرئيسية', // ✅ Hide header for MainTabs
      headerStyle: { backgroundColor: '#000' },
      headerTitleStyle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 18 },
      headerTintColor: '#ffc546',
      headerTitleAlign: 'center',
      headerRight: () => null,

      // ✅ This line ADDS the hamburger only on the right
      headerLeft : () =>
        route.name === 'الرئيسية' ? <HeaderLeftHamburger /> : <HeaderLeftHamburger />,

    })}
  >
    <Drawer.Screen name="الرئيسية" component={MainTabs} />
    <Drawer.Screen name="التحقق من الشهادة" component={VerifyCertificateScreen} options={{ title: 'التحقق من الشهادات' }} />
    <Drawer.Screen name="اتصل بنا" component={ContactUsScreen} options={{ title: 'اتصل بنا' }} />
    <Drawer.Screen name="موقعنا" component={OurLocationScreen} options={{ title: 'موقعنا' }} />
  </Drawer.Navigator>
);

// App wrapper with splash + stack screens
const AppNavigator = ({ showSplash }) => (
  <NavigationContainer>
    <Stack.Navigator>
      {showSplash ? (
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="MainApp" component={MainDrawer} options={{ headerShown: false }} />
          <Stack.Screen
            name="SubCourses"
            component={SubCoursesScreen}
            options={({ route }) => ({
              title: route.params?.title || 'الدورات الفرعية',
              headerStyle: { backgroundColor: '#000' },
              headerTitleStyle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 18 },
              headerTintColor: '#ffc546',
              headerTitleAlign: 'center',
            })}
          />
        </>
      )}
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
