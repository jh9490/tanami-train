// src/navigation/AppNavigator.tsx
import React from 'react';
import { I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
/* Providers */
import { AuthProvider, useAuth } from '../context/AuthContext';

/* Screens */
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import GalleryScreen from '../screens/GalleryScreen';
import SubCoursesScreen from '../screens/SubCoursesScreen';
import MenuScreen from '../screens/menu/MenuScreen';
import VerifyCertificateScreen from '../screens/VerifyCertificateScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import OurLocationScreen from '../screens/OurLocationScreen';
import CVFormScreen from '../screens/cv/CVFormScreen';

/* Auth screens */
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import VerifyScreen from '../screens/auth/VerifyScreen';

/* Account/Settings */
import AccountScreen from '../screens/AccountScreen';
import SettingsScreen from '../screens/SettingsScreen';


/* User Screen */
import MyNotifications from '../screens/MyNotificationsScreen';
import MyCourses from '../screens/MyCoursesScreen';
import CourseTabs from '../screens/CourseTabsScreen';
import MyRegistrationRequests from '../screens/MyRegistrationRequests';
import MyPhotosScreen from '../screens/MyPhotosScreen';
import { rtlStyles } from '../theme/rtl';

/* ===== Types ===== */
export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  SubCourses: { title?: string } | undefined;
  CVGenerator: undefined;

  AuthStack: { screen?: keyof AuthStackParamList } | undefined;
  AccountStack: { screen?: keyof AccountStackParamList } | undefined;
  UserStack: { screen?: keyof UserStackParamList } | undefined;

};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  Gallery: undefined;
  MenuRoot: undefined;
};

export type MenuStackParamList = {
  MenuScreen: undefined;
  VerifyCertificate: undefined;
  ContactUs: undefined;
  OurLocation: undefined;
  MyPhotos: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
  OtpVerify: { mobile: string; name?: string } | undefined;
  PhoneLoginScreen: undefined;
};

export type AccountStackParamList = {
  Account: undefined;
  Settings: undefined;
};


export type UserStackParamList = {
  MyNotifications: undefined;
  MyCourses: undefined;
  CourseTabs: { courseId: string; title: string } | undefined;
  MyRegistrationRequests: undefined;
  VerifyCertificateScreen: undefined;
};

/* ===== Navigators ===== */
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const MenuStackNav = createNativeStackNavigator<MenuStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const AccountStackNav = createNativeStackNavigator<AccountStackParamList>();
const UserStackNav = createNativeStackNavigator<UserStackParamList>();
/* ===== Shared Header Style ===== */
const headerCommon = {
  headerStyle: { backgroundColor: '#0c2a20' },
  headerTitleStyle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 18 },
  headerTintColor: '#cbae82',
  headerTitleAlign: 'center' as const,
  contentStyle: rtlStyles.screen,
};

/* ===== Menu stack (for “القائمة” tab) ===== */
function MenuStack() {
  return (
    <MenuStackNav.Navigator screenOptions={headerCommon}>
      <MenuStackNav.Screen
        name="MenuScreen"
        component={MenuScreen}
        options={{ title: 'القائمة' }}
      />
      <MenuStackNav.Screen
        name="VerifyCertificate"
        component={VerifyCertificateScreen}
        options={{ title: 'التحقق من الشهادات' }}
      />
      <MenuStackNav.Screen
        name="ContactUs"
        component={ContactUsScreen}
        options={{ title: 'اتصل بنا' }}
      />
      <MenuStackNav.Screen
        name="OurLocation"
        component={OurLocationScreen}
        options={{ title: 'موقعنا' }}
      />
      <MenuStackNav.Screen
        name="MyPhotos"
        component={MyPhotosScreen}
        options={{ title: 'صـوري' }}
      />
      <MenuStackNav.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'الإعدادات' }}
      />
    </MenuStackNav.Navigator>
  );
}

/* ===== Auth stack ===== */
function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={headerCommon}>
      <AuthStackNav.Screen name="SignIn" component={SignInScreen} options={{ title: 'تسجيل الدخول' }} />
      <AuthStackNav.Screen name="SignUp" component={SignUpScreen} options={{ title: 'إنشاء حساب' }} />
      <AuthStackNav.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'إعادة تعيين كلمة المرور' }} />
      <AuthStackNav.Screen name="OtpVerify" component={VerifyScreen} options={{ title: 'رمز التحقق' }} />

    </AuthStackNav.Navigator>
  );
}

/* ===== Account stack ===== */
function AccountStack() {
  return (
    <AccountStackNav.Navigator screenOptions={headerCommon}>
      <AccountStackNav.Screen name="Account" component={AccountScreen} options={{ title: 'حسابي' }} />
      <AccountStackNav.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات' }} />
    </AccountStackNav.Navigator>
  );
}



/* ===== User stack ===== */

function UserStack() {
  return (
    <UserStackNav.Navigator screenOptions={headerCommon}>
      <UserStackNav.Screen
        name="MyNotifications"
        component={MyNotifications}
        options={{ title: 'إشعاراتي' }}
      />
      <UserStackNav.Screen
        name="MyCourses"
        component={MyCourses}
        options={{ title: 'دوراتي' }}
      />
      <UserStackNav.Screen
        name="CourseTabs"
        component={CourseTabs}
        options={({ route }) => ({ title: route.params?.title ?? 'الدورة' })}
      />
      <UserStackNav.Screen
        name="MyRegistrationRequests"
        component={MyRegistrationRequests}
        options={{ title: 'طلباتي' }}
      />
      <UserStackNav.Screen
        name="VerifyCertificateScreen"
        component={VerifyCertificateScreen}
        options={{ title: 'تحقق من شهادة' }}
      />
    </UserStackNav.Navigator>
  );
}


/* ===== Bottom Tabs ===== */
function MainTabs() {
  const insets = useSafeAreaInsets();
  const getHeaderTitle = (name: keyof MainTabParamList) => {
    switch (name) {
      case 'Home': return 'الرئيسية';
      case 'Courses': return 'الحقائب';
      case 'Gallery': return 'المعرض';
      case 'MenuRoot': return 'القائمة';
      default: return 'تنامي';
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Home' ? 'home' :
              route.name === 'Courses' ? 'book' :
                route.name === 'Gallery' ? 'image' : 'menu';
          const transform = I18nManager.isRTL ? [{ scaleX: -1 }] : undefined;
          return <Icon name={iconName} size={size} color={color} style={{ transform }} />;
        },
        headerShown: route.name !== 'MenuRoot', // let Menu stack render its own header
        headerTitle: getHeaderTitle(route.name as keyof MainTabParamList),
        ...headerCommon,
        headerLeft: () => null,
        headerRight: () => null,
        tabBarStyle: {
          backgroundColor: '#0c2a20',
          borderTopColor: '#ccc',
          borderTopWidth: 1,
          height: 75 + insets.bottom,
          paddingBottom: Math.max(10, insets.bottom),
          paddingTop: 8,
          direction: 'rtl',
        },
        sceneStyle: rtlStyles.screen,
        tabBarLabelStyle: { fontSize: 12, fontFamily: 'NotoKufiArabic-Bold' },
        tabBarActiveTintColor: '#cbae82',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'الرئيسية' }} />
      <Tab.Screen name="Courses" component={CoursesScreen} options={{ tabBarLabel: 'الحقائب' }} />
      <Tab.Screen name="Gallery" component={GalleryScreen} options={{ tabBarLabel: 'المعرض' }} />
      <Tab.Screen name="MenuRoot" component={MenuStack} options={{ tabBarLabel: 'القائمة', headerShown: false }} />
    </Tab.Navigator>
  );
}

/* ===== Root stack (tabs + pushable stacks) ===== */
function Root() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {/* If you later want Splash: set it first, then MainTabs after a flag */}
      {/* <RootStack.Screen name="Splash" component={SplashScreen} /> */}

      <RootStack.Screen name="MainTabs" component={MainTabs} />

      <RootStack.Screen
        name="SubCourses"
        component={SubCoursesScreen}
        options={{
          headerShown: true,
          ...headerCommon,
          title: 'الدورات',
        }}
      />

      <RootStack.Screen
        name="CVGenerator"
        component={CVFormScreen}
        options={{
          headerShown: true,
          ...headerCommon,
          title: 'سيرتي',
        }}
      />

      <RootStack.Screen
        name="AuthStack"
        component={AuthStack}
        options={{ headerShown: false }}
      />

      <RootStack.Screen
        name="AccountStack"
        component={AccountStack}
        options={{ headerShown: false }}
      />


      <RootStack.Screen
        name="UserStack"
        component={UserStack}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}

/* ===== App root with AuthProvider + Navigation ===== */
export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer direction="rtl">
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}
