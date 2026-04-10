// AuthStack.tsx
import React from 'react';
import { I18nManager } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OtpDeliveryMethod } from '../auth/otp';
import SignInScreen from './auth/SignInScreen';
import SignUpScreen from './auth/SignUpScreen';
import OtpVerifyScreen from './auth/VerifyScreen';
import ResetPasswordScreen from './auth/ResetPasswordScreen';

I18nManager.forceRTL(true);

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  OtpVerify: {
    mobile: string;
    context: 'signup' | 'signin';
    deliveryMethod: OtpDeliveryMethod;
  };
  ResetPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitleStyle: { fontFamily: 'NotoKufiArabic-Bold' },
        statusBarStyle: 'dark',
      }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'تسجيل الدخول' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'إنشاء حساب' }} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{ title: 'تأكيد رقم الجوال' }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'إعادة تعيين كلمة المرور' }} />
    </Stack.Navigator>
  );
};

export default AuthStack;
