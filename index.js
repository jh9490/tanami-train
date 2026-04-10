/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import { AuthProvider } from './src/context/AuthContext';  // 👈 add
import { configureAppRTL } from './src/theme/rtl';

configureAppRTL();

// REQUIRED: background/quit handler (runs in Headless JS)
messaging().setBackgroundMessageHandler(async remoteMessage => {
    // Keep it lightweight. If you send "notification" payloads,
    // Android will show them automatically. For data-only, you can
    // post a local notification here if you want.
    // e.g. using notifee (optional):
    // const notifee = (await import('@notifee/react-native')).default;
    // const {AndroidImportance} = await import('@notifee/react-native');
    // const channelId = await notifee.createChannel({ id:'default', name:'General', importance: AndroidImportance.HIGH });
    // await notifee.displayNotification({ title:'Tanami Train', body:'Background msg', android:{ channelId }});
  });

  const Root = () => (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  
  AppRegistry.registerComponent(appName, () => Root);
