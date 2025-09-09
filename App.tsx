import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  // 👇 Global font override for all <Text> elements
  useEffect(() => {
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.allowFontScaling = false;
    Text.defaultProps.style = [
      Text.defaultProps.style || {},
      { fontFamily: 'NotoKufiArabic-Regular' },
    ];

    const timer = setTimeout(() => setShowSplash(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator showSplash={showSplash} />
    </GestureHandlerRootView>
  );
};

export default App;
