import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { TANAMI_WHATSAPP_URL } from '../../constants/contact';
import { colors } from '../../theme/colors';
import { openLinkSafe } from '../../util/Linker';

export default function SupportFloatingButton() {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      testID="support-floating-button"
      accessibilityRole="button"
      accessibilityLabel="التواصل مع الدعم عبر واتساب"
      activeOpacity={0.85}
      onPress={() => openLinkSafe(TANAMI_WHATSAPP_URL)}
      style={[styles.button, { bottom: Math.max(insets.bottom, 12) + 82 }]}
    >
      <Icon name="life-ring" size={26} color={colors.greenDarker} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
});
