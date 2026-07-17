/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    GestureHandlerRootView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

jest.mock('react-native-animatable', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  const createAnimatable = (Component: any) =>
    React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        animate: jest.fn(() => Promise.resolve()),
        fadeIn: jest.fn(() => Promise.resolve()),
      }));

      return React.createElement(Component, props, props.children);
    });

  return {
    View: createAnimatable(View),
    Text: createAnimatable(Text),
  };
});

jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');

  return ({ children, ...props }: any) => React.createElement(View, props, children);
});

jest.mock('../src/navigation/AppNavigator', () => {
  const React = require('react');
  const { View } = require('react-native');

  return () => React.createElement(View);
});

jest.mock('../src/services/notifications', () => ({
  initNotifications: jest.fn(() => Promise.resolve(() => {})),
}));

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    subscribeToTopic: jest.fn(() => Promise.resolve()),
  });

  return {
    __esModule: true,
    default: messaging,
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
