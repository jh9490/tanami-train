import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const MOCK = [
  { id: 'n1', title: 'تهانينا!', body: 'تم إصدار شهادتك لدورة إدارة الوقت.', date: '2025-09-01' },
  { id: 'n2', title: 'تذكير', body: 'تبدأ دورتك غدًا الساعة 5 مساءً.', date: '2025-09-05' },
  { id: 'n3', title: 'تحديث', body: 'إضافة مواد جديدة إلى مكتبة الدورة.', date: '2025-09-06' },
];

export default function MyNotificationsScreen() {
  const [selected, setSelected] = useState<typeof MOCK[0] | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 12 }}>
      <View style={styles.card}>
        <FlatList
          data={MOCK}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelected(item)}
              style={styles.row}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.preview} numberOfLines={1}>{item.body}</Text>
              </View>
              <Text style={styles.date}>{item.date}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#eee' }} />}
        />
      </View>

      {/* Dialog */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.modalBody}>{selected?.body}</Text>
            <TouchableOpacity onPress={() => setSelected(null)} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#eceadf', borderRadius: 14, padding: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 },
  title: { fontFamily: 'NotoKufiArabic-Bold', color: '#111', fontSize: 14 },
  preview: { fontFamily: 'NotoKufiArabic-Regular', color: '#555', fontSize: 12, marginTop: 4 },
  date: { fontFamily: 'NotoKufiArabic-Regular', color: '#888', fontSize: 11, marginHorizontal: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: '#eceadf', borderRadius: 14, padding: 16, width: '86%' },
  modalTitle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, color: '#111', textAlign: 'center' },
  modalBody: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 14, color: '#333', marginTop: 8, textAlign: 'right', lineHeight: 22 },
  modalBtn: { marginTop: 16, backgroundColor: '#0f4f30', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  modalBtnText: { color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold', fontSize: 14 },
});
