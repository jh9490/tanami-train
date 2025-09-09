import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const MOCK = {
  current: [{ id: 'c101', title: 'مهارات العرض', date: '2025-09-10' }],
  upcoming: [{ id: 'c201', title: 'إدارة الوقت', date: '2025-10-02' }],
  old: [{ id: 'c001', title: 'أساسيات القيادة', date: '2025-07-05' }],
};

type Item = { id: string; title: string; date: string };
type Tab = 'current' | 'upcoming' | 'old';

export default function MyCoursesScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('current');

  const data: Item[] = useMemo(() => {
    return MOCK[tab];
  }, [tab]);

  const TabBtn = ({ value, label }: { value: Tab; label: string }) => (
    <TouchableOpacity
      onPress={() => setTab(value)}
      style={[styles.segBtn, tab === value && styles.segBtnActive]}
      activeOpacity={0.8}
    >
      <Text style={[styles.segText, tab === value && styles.segTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 12 }}>
      {/* Segmented filter */}
      <View style={styles.segmented}>
        <TabBtn value="current" label="الحالية" />
        <TabBtn value="upcoming" label="القادمة" />
        <TabBtn value="old" label="السابقة" />
      </View>

      {/* List */}
      <View style={styles.card}>
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('CourseTabs', { courseId: item.id, title: item.title })}
              style={styles.row}
              activeOpacity={0.8}
            >
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDate}>{item.date}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={<Text style={styles.empty}>لا توجد دورات في هذا القسم</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#eee',
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
  },
  segBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginHorizontal: 2,
  },
  segBtnActive: { backgroundColor: '#0f4f30' },
  segText: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 12, color: '#333' },
  segTextActive: { color: '#eceadf' },

  card: { backgroundColor: '#eceadf', borderRadius: 14, padding: 6, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  row: { paddingVertical: 14, paddingHorizontal: 8, alignItems: 'flex-start' },
  rowTitle: { fontFamily: 'NotoKufiArabic-Bold', color: '#111', fontSize: 14 },
  rowDate: { fontFamily: 'NotoKufiArabic-Regular', color: '#777', fontSize: 12, marginTop: 4 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#eee' },
  empty: { textAlign: 'center', color: '#666', fontFamily: 'NotoKufiArabic-Regular', paddingVertical: 16 },
});
