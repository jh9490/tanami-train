import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, I18nManager, Switch } from 'react-native';

export default function SettingsScreen() {
  const [rtlOn] = React.useState<boolean>(I18nManager.isRTL);
  const [notifications, setNotifications] = React.useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        <View style={styles.item}>
          <Text style={styles.itemText}>الإشعارات</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>



      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff1e2', padding: 16 },
  card: {
    backgroundColor: '#eceadf', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  title: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 18, color: '#111', textAlign: 'right', marginBottom: 12 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee',
  },
  itemText: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: '#1f2937' },
  badge: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 12, color: '#6b7280', marginLeft: 'auto' },
  linkBtn: { paddingVertical: 12 },
  linkText: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, color: '#0066cc'},
});
