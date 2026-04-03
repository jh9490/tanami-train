// App.tsx
import React, { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreen from './src/screens/SplashScreen';
import AppNavigator from './src/navigation/AppNavigator';

import { initNotifications } from './src/services/notifications';
import messaging from '@react-native-firebase/messaging';
import { api } from './src/services/api';
import { getOrCreateDeviceId } from './src/util/deviceId';
import { useAuth } from './src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { user, profile, isAuthenticated } = useAuth();

  // --- Disable font scaling globally ---
  useEffect(() => {
    // Text defaults (you already had something like this)
    const RNText = Text as any;
    RNText.defaultProps = RNText.defaultProps || {};
    RNText.defaultProps.allowFontScaling = false;
    RNText.defaultProps.style = [
      RNText.defaultProps.style || {},
      { fontFamily: 'NotoKufiArabic-Regular' , color : "#111"},
    ];
  
    // TextInput defaults
    const RNTextInput = TextInput as any;
    RNTextInput.defaultProps = RNTextInput.defaultProps || {};
    RNTextInput.defaultProps.allowFontScaling = false;
    RNTextInput.defaultProps.style = [
      RNTextInput.defaultProps.style || {},
      { color: '#111', fontFamily: 'NotoKufiArabic-Regular' },
    ];
    RNTextInput.defaultProps.placeholderTextColor = '#8a8a8a';
    RNTextInput.defaultProps.selectionColor = '#0f4f30';
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
