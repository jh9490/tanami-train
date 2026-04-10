// App.tsx
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreen from './src/screens/SplashScreen';
import AppNavigator from './src/navigation/AppNavigator';

import { initNotifications } from './src/services/notifications';
import messaging from '@react-native-firebase/messaging';
import { api } from './src/services/api';
import { getOrCreateDeviceId } from './src/util/deviceId';
import { useAuth } from './src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureAppRTL, rtlStyles } from './src/theme/rtl';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { user, profile, isAuthenticated } = useAuth();

  const appendStyleDefault = (Component: any, stylePatch: object) => {
    Component.defaultProps = Component.defaultProps || {};
    Component.defaultProps.style = [Component.defaultProps.style || {}, stylePatch];
  };

  const appendContentStyleDefault = (Component: any, stylePatch: object) => {
    Component.defaultProps = Component.defaultProps || {};
    Component.defaultProps.contentContainerStyle = [
      Component.defaultProps.contentContainerStyle || {},
      stylePatch,
    ];
  };

  useEffect(() => {
    configureAppRTL();
  }, []);

  // --- Disable font scaling globally ---
  useEffect(() => {
    // Text defaults (you already had something like this)
    const RNText = Text as any;
    RNText.defaultProps = RNText.defaultProps || {};
    RNText.defaultProps.allowFontScaling = false;
    RNText.defaultProps.style = [
      RNText.defaultProps.style || {},
      {
        color: '#111',
        fontFamily: 'NotoKufiArabic-Regular',
        textAlign: 'right',
        writingDirection: 'rtl',
      },
    ];
  
    // TextInput defaults
    const RNTextInput = TextInput as any;
    RNTextInput.defaultProps = RNTextInput.defaultProps || {};
    RNTextInput.defaultProps.allowFontScaling = false;
    RNTextInput.defaultProps.style = [
      RNTextInput.defaultProps.style || {},
      {
        color: '#111',
        fontFamily: 'NotoKufiArabic-Regular',
        textAlign: 'right',
        writingDirection: 'rtl',
      },
    ];
    RNTextInput.defaultProps.placeholderTextColor = '#8a8a8a';
    RNTextInput.defaultProps.selectionColor = '#0f4f30';

    // Layout containers default to RTL as well so screens stay Arabic-first
    appendStyleDefault(View as any, rtlStyles.screen);
    appendStyleDefault(ScrollView as any, rtlStyles.screen);
    appendContentStyleDefault(ScrollView as any, rtlStyles.screen);
    appendStyleDefault(FlatList as any, rtlStyles.screen);
    appendContentStyleDefault(FlatList as any, rtlStyles.screen);
    appendStyleDefault(TouchableOpacity as any, rtlStyles.screen);
  }, []);

  // --- Notifications setup ---
  useEffect(() => {
    console.log(
      '[Auth] isAuthenticated=',
      isAuthenticated,
      ' profileId=',
      isAuthenticated ? profile?.id : null
    );

    let cleanup = () => {};
    if (!showSplash) {
      (async () => {
        cleanup = await initNotifications({
          // fires on first token + any refresh
          onToken: async (token) => {
            console.log('FCM token:', token);
            try {
              const deviceId = await getOrCreateDeviceId();
              await api.registerPushToken({
                profile_id: null, // guest by default — real profileId used later inside notifications.ts
                device_id: deviceId,
                platform: 'android',
                token,
                app_version: '1.0.1',
              });
            } catch (e) {
              console.log('registerPushToken failed:', e);
            }
          },
          onOpen: (data) => {
            console.log('Opened from notification:', data);
            // Example deep link:
            // if (data.screen === 'CourseTabs' && data.activityId) {
            //   navRef?.navigate('CourseTabs', { activityId: Number(data.activityId) });
            // }
          },
        });

        try {
          await messaging().subscribeToTopic('general');
        } catch (e) {
          console.log('subscribeToTopic failed:', e);
        }
      })();
    }
    return () => cleanup();
  }, [showSplash, isAuthenticated, profile?.id, user?.id]);

  return (
    <GestureHandlerRootView style={[{ flex: 1 }, rtlStyles.screen]}>
      {showSplash ? (
        <SplashScreen onDone={() => setShowSplash(false)} />
      ) : (
         <SafeAreaProvider>
           <AppNavigator />
       </SafeAreaProvider>
      )}
    </GestureHandlerRootView>
  );
};

export default App;
