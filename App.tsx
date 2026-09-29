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
import {startPushInstallationService} from './src/services/pushInstallation';
import { useAuth } from './src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureAppRTL, rtlStyles } from './src/theme/rtl';
import { HISTORY_LINK_STATUS_CHANGED_EVENT } from './src/constants/onboarding';
import {checkAndPromptForUpdate} from './src/util/appUpdate';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const {refreshBootstrap} = useAuth();

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

  // Check once per launch after the splash screen. Automatic checks are quiet
  // when the installed version is current or the device is offline.
  useEffect(() => {
    if (!showSplash) {
      checkAndPromptForUpdate(undefined, {showUpToDate: false}).catch(() => undefined);
    }
  }, [showSplash]);

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
    let cancelled = false;
    let cleanupNotifications = () => {};
    let cleanupPushInstallation = () => {};
    if (!showSplash) {
      (async () => {
        const handleNotificationData = async (data: Record<string, string>) => {
          if (data.event === HISTORY_LINK_STATUS_CHANGED_EVENT) {
            await refreshBootstrap();
          }
        };

        cleanupNotifications = await initNotifications({
          onMessage: handleNotificationData,
          onOpen: async (data) => {
            console.log('Opened from notification:', data);
            await handleNotificationData(data);
            // Example deep link:
            // if (data.screen === 'CourseTabs' && data.activityId) {
            //   navRef?.navigate('CourseTabs', { activityId: Number(data.activityId) });
            // }
          },
        });
        cleanupPushInstallation = await startPushInstallationService();

        if (cancelled) {
          cleanupNotifications();
          cleanupPushInstallation();
        }
      })();
    }
    return () => {
      cancelled = true;
      cleanupNotifications();
      cleanupPushInstallation();
    };
  }, [showSplash, refreshBootstrap]);

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
