import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CourseItem } from '../types/api';

type Phase = 'current' | 'upcoming' | 'previous';

export default function MyCoursesScreen({ navigation }: any) {
  const [tab, setTab] = useState<Phase>('current');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CourseItem[]>([]);

  const { user, token } = useAuth();
  const mobile: string | undefined = user?.username || undefined;
  const [studentId, setStudentId] = useState<number | null>(null); 

  const fetchCourses = useCallback(
    async (phase: Phase) => {
      if (!token) return;
      if (!mobile) {
        Alert.alert('تنبيه', 'لا يوجد رقم جوال للمستخدم.');
        setData([]);
        return;
      }

      try {
        setLoading(true);
        setData([]);
         if(!user?.username)
           return
        const json = await api.fetchCourses(token, user?.username, phase);
       
        if (json.result === 1)
          { 
            setData(json.items || []);
            setStudentId(json.student?.id ?? null);
           
          }
        else setData([]);
      } catch (err) {
        console.error('fetchCourses error', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [token, mobile]
  );

  useEffect(() => {
    fetchCourses(tab);
  }, [tab, fetchCourses]);

  const TabBtn = ({ value, label }: { value: Phase; label: string }) => (
    <TouchableOpacity
      onPress={() => setTab(value)}
      style={[styles.segBtn, tab === value && styles.segBtnActive]}
      activeOpacity={0.8}
    >
      <Text style={[styles.segText, tab === value && styles.segTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const onPressItem = (item: CourseItem) => {
    const courseId = item.course?.id;
    const title = item.course?.name_ar || 'دورة';
    const activityId = item.activity?.id; // 👈 add this
     // prefer the fetched studentId; if missing, fall back to user.id if you have it
    // const resolvedStudentId = studentId ?? (user as any)?.id ?? undefined;
    // console.log(resolvedStudentId);
    if (!courseId) return;
    navigation.navigate('CourseTabs', { courseId, title , activityId , studentId});
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2', padding: 12 }}>
      {/* segmented filter */}
      <View style={styles.segmented}>
        <TabBtn value="current" label="الحالية" />
        <TabBtn value="upcoming" label="القادمة" />
        <TabBtn value="previous" label="السابقة" />
      </View>

      {/* list */}
      <View style={styles.listWrap}>
        {loading ? (
          <ActivityIndicator size="large" color="#0f4f30" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(it, idx) =>
              String(it.registration_id ?? it.activity?.id ?? it.course?.id ?? idx)
            }
            renderItem={({ item }) => {
              const title = item.course?.name_ar ?? 'دورة';
              const date = item.activity?.date ?? '';
              const end = item.activity?.end_date ? ` - ${item.activity.end_date}` : '';
            
              return (
                <View style={styles.cardItem}>
                  {/* title + small link on one row */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
            
                    <TouchableOpacity
                      onPress={() => onPressItem(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.viewLink}>عرض</Text>
                    </TouchableOpacity>
                  </View>
            
                  <Text style={styles.cardSub}>
                    {date}{end}
                  </Text>
                </View>
              );
            }}
            // ItemSeparatorComponent={() => <View style={styles.sep} />} // optional now
            ListEmptyComponent={
              <Text style={styles.empty}>لا توجد دورات في هذا القسم</Text>
            }
            contentContainerStyle={{ paddingVertical: 6 }}
          />
        )}
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

  // neutral wrapper so the individual cards stand out
  listWrap: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // individual course card
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eceadf',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontFamily: 'NotoKufiArabic-Bold',
    color: '#0f4f30',
    fontSize: 15,
    // textAlign: 'right',
  },
  cardSub: {
    marginTop: 6,
    fontFamily: 'NotoKufiArabic-Regular',
    color: '#555',
    fontSize: 12,
    // textAlign: 'right',
  },

  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#eee' },
  empty: {
    textAlign: 'center',
    color: '#666',
    fontFamily: 'NotoKufiArabic-Regular',
    paddingVertical: 16,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8, // RN 0.71+; if older, remove
  },
  viewLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'NotoKufiArabic-Regular',
    // theme color
    color: '#0f4f30',
    // keep it snug to the top-right for RTL content too
    // writingDirection: 'rtl', // optional if you want RTL text flow
  },
  
});
