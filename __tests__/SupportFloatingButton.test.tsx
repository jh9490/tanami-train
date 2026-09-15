import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { TANAMI_WHATSAPP_URL } from '../src/constants/contact';
import SupportFloatingButton from '../src/screens/components/SupportFloatingButton';
import { openLinkSafe } from '../src/util/Linker';

jest.mock('../src/util/Linker', () => ({
  openLinkSafe: jest.fn(),
}));

jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 12, left: 0 }),
}));

describe('SupportFloatingButton', () => {
  it('opens the same configured WhatsApp link used by Home', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<SupportFloatingButton />);
    });

    await act(async () => {
      renderer.root.findByProps({ testID: 'support-floating-button' }).props.onPress();
    });

    expect(renderer.root.findByProps({ name: 'life-ring' })).toBeTruthy();
    expect(openLinkSafe).toHaveBeenCalledWith(TANAMI_WHATSAPP_URL);
  });
});
