import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import ThemedBackground from './components/ThemedBackground';
import { colors } from '../theme/colors';

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);

  return (
    <ThemedBackground style={styles.container}>
      <View style={styles.card}>

        <View style={styles.item}>
          <Text style={styles.itemText}>الإشعارات</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>



      </View>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    backgroundColor: 'rgba(255, 248, 239, 0.12)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255, 248, 239, 0.16)',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  title: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 18, color: colors.cream, textAlign: 'right', marginBottom: 12 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255, 248, 239, 0.16)',
  },
  itemText: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: colors.cream },
  badge: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 12, color: '#6b7280', marginLeft: 'auto' },
  linkBtn: { paddingVertical: 12 },
  linkText: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: '#0066cc'},
});
