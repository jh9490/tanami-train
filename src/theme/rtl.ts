import { I18nManager } from 'react-native';

export const APP_LAYOUT_DIRECTION = 'rtl' as const;
export const APP_IS_RTL = true;

export function configureAppRTL() {
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);

  if (!I18nManager.isRTL) {
    I18nManager.forceRTL(true);
  }
}

export const rtlStyles = {
  screen: {
    direction: APP_LAYOUT_DIRECTION,
  } as const,
  text: {
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  row: {
    flexDirection: 'row-reverse' as const,
  },
  rowCenter: {
    flexDirection: 'row-reverse' as const,
    alignItems: 'center' as const,
  },
};
