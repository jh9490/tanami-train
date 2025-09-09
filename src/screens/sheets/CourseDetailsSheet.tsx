import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

/** Convert messy HTML-ish text into clean bullet lines */
export const cleanToBullets = (raw?: string | null): string[] => {
  if (!raw) return [];
  let s = String(raw);

  s = s
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*li\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '- ')
    .replace(/<\s*\/?(ul|ol|p|div)[^>]*>/gi, '\n')
    .replace(/&nbsp;?/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]*>/g, '');

  s = s
    .replace(/[;•·]+/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

  return s
    .split('\n')
    .map(l => l.replace(/^\s*[-–*]\s*/, '').trim())
    .filter(Boolean);
};

type Props = {
  title: string;
  headLines?: string | null;
  /** if you render inside a small container (bottom sheet) */
  maxHeight?: number;
};

const CourseDetailsSheet: React.FC<Props> = ({ title, headLines, maxHeight }) => {
  const lines = cleanToBullets(headLines);

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>{title}</Text>

      {lines.length ? (
        <ScrollView style={[styles.scroll, maxHeight ? { maxHeight } : null]}
                    contentContainerStyle={{ paddingTop: 8 }}>
          {lines.map((line, idx) => (
            <View key={idx} style={styles.liRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.liText}>{line}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>لا توجد تفاصيل متاحة.</Text>
      )}
    </View>
  );
};

export default CourseDetailsSheet;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  scroll: { },
  h1: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 18, color: '#111' },
  liRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bullet: { marginLeft: 8, color: '#0f4f30', fontSize: 18, lineHeight: 22 },
  liText: {
    flex: 1, fontFamily: 'NotoKufiArabic-Regular', fontSize: 14,
    color: '#333', lineHeight: 22
  },
  empty: { textAlign: 'center', color: '#666', marginTop: 16, fontFamily: 'NotoKufiArabic-Regular' },
});
