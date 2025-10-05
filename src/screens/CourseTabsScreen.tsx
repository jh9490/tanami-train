// screens/CourseTabsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CertificatePreview from './components/CertificatePreview'; // ← adjust path if needed

const Tab = createMaterialTopTabNavigator();

/* ---------------- Types that match your APIs ---------------- */
interface GetCourseResponse {
  ok: boolean;
  course?: {
    id: number;
    name?: string;
    name_ar?: string;
    name_en?: string;
    course_head_lines?: string; // HTML
    days?: number;
    hours?: number;
    cost?: number;
    grade?: string | null;
    package_id?: number;
  };
}

type ActivityFile = {
  id: number;
  name: string;
  mime: string;
  size: number;
  url: string;
  uploaded_at?: string;
  sha1?: string;
};

/* ---------------- Normalizers & helpers ---------------- */
type NormalizedCourse = {
  title: string;
  descriptionHtml?: string;
  meta?: { days?: number; hours?: number; cost?: number };
};

function normalizeCourse(json: GetCourseResponse): NormalizedCourse {
  const c = json.course!;
  return {
    title: c.name_ar || c.name_en || c.name || 'الدورة',
    descriptionHtml: c.course_head_lines || undefined,
    meta: { days: c.days, hours: c.hours, cost: c.cost },
  };
}

function splitActivityFiles(files: ActivityFile[]) {
  const images: ActivityFile[] = [];
  const docs: ActivityFile[] = [];
  for (const f of files) {
    const m = (f.mime || '').toLowerCase();
    if (m.startsWith('image/')) images.push(f);
    else docs.push(f);
  }
  return { images, docs };
}

/** crude HTML→text so Arabic content stays readable without extra deps */
function htmlToText(html?: string) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Props your CertificatePreview expects */
type CertificatePreviewProps = {
  serial: string;
  nameAr: string;
  nameEn?: string;
  courseAr: string;
  courseEn?: string;
  hours?: number;
  date?: string;
  grade?: string;
  authorized: boolean;
  showShareButtons?: boolean;
};

/** Adapt the cert API shape → CertificatePreview props */
function normalizeCertificateForPreview(json: any): CertificatePreviewProps | undefined {
  if (!json?.ok || !json.certificate) return undefined;
  const c = json.certificate;

  // Derive authorized: treat status===1 as authorized, else false
  const authorized = Number(c.status) === 1;

  return {
    serial: c.certificate_id || c.serial || '-',
    nameAr: c.student?.name ?? '-',                // API provides a single name
    nameEn: undefined,                              // not provided by API
    courseAr: c.activity?.course_name ?? '-',       // API provides a single course name
    courseEn: undefined,
    hours: c.course?.hours ?? undefined,            // only if backend adds it
    date: c.date ?? undefined,
    grade: c.grade ?? undefined,
    authorized,
    showShareButtons: true,
  };
}

/* ---------------- Tabs (presentational) ---------------- */

function DetailsTab({ route }: any) {
  const { title, descriptionHtml, meta } = route.params as {
    title: string;
    descriptionHtml?: string;
    meta?: { days?: number; hours?: number; cost?: number };
  };

  const plain = htmlToText(descriptionHtml);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff1e2', padding: 12 }}>
      <Text style={styles.h1}>{title}</Text>

      {meta && (meta.days || meta.hours || meta.cost !== undefined) ? (
        <Text style={styles.meta}>
          {meta.days ? `عدد الأيام: ${meta.days}  ` : ''}
          {meta.hours ? `| الساعات: ${meta.hours}  ` : ''}
          {meta.cost !== undefined ? `| التكلفة: ${meta.cost}` : ''}
        </Text>
      ) : null}

      <Text style={styles.body}>
        {plain || 'لا تتوفر تفاصيل لهذه الدورة حالياً.'}
      </Text>
    </ScrollView>
  );
}

/** Single merged tab: Media (صور / ملفات) */
function MediaTab({ route }: any) {
  const { images, docs } = route.params as { images: ActivityFile[]; docs: ActivityFile[] };
  const [seg, setSeg] = useState<'images' | 'docs'>('images');

  const open = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('تنبيه', 'تعذّر فتح الرابط.'));
  };

  const EmptyState = ({ text }: { text: string }) => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff1e2' }}>
      {/* mini segmented control */}
      <View style={styles.segmented}>
        <TouchableOpacity
          onPress={() => setSeg('images')}
          style={[styles.segBtn, seg === 'images' && styles.segBtnActive]}
        >
          <Text style={[styles.segText, seg === 'images' && styles.segTextActive]}>الصور</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSeg('docs')}
          style={[styles.segBtn, seg === 'docs' && styles.segBtnActive]}
        >
          <Text style={[styles.segText, seg === 'docs' && styles.segTextActive]}>الملفات</Text>
        </TouchableOpacity>
      </View>

      {/* content */}
      {seg === 'images' ? (
        images.length === 0 ? (
          <EmptyState text="لا توجد صور للعرض." />
        ) : (
          <ScrollView style={{ padding: 12 }}>
            <View style={styles.grid}>
              {images.map((f) => (
                <TouchableOpacity key={f.id} onPress={() => open(f.url)} activeOpacity={0.85}>
                  <Image source={{ uri: f.url }} style={styles.thumb} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )
      ) : docs.length === 0 ? (
        <EmptyState text="لا توجد ملفات متاحة حالياً." />
      ) : (
        <ScrollView style={{ padding: 12 }}>
          {docs.map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => open(f.url)}
              activeOpacity={0.8}
              style={styles.fileCard}
            >
              <Text style={styles.fileTitle} numberOfLines={2}>
                {f.name || 'ملف'}
              </Text>
              <Text style={styles.fileMeta}>
                {f.mime?.toUpperCase()} • {(f.size / 1024 / 1024).toFixed(2)} MB
                {f.uploaded_at ? ` • ${f.uploaded_at}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function CertificateTab({ route }: any) {
  const { certificate } = route.params as { certificate?: CertificatePreviewProps };

  if (!certificate) {
    return (
      <View style={styles.center}>
        <Text style={styles.h1}>شهادتي</Text>
        <Text style={styles.bodySmall}>لا توجد شهادة متاحة لهذا النشاط.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff1e2', padding: 16 }}>
      <CertificatePreview {...certificate} />
    </ScrollView>
  );
}

/* ---------------- Parent: fetch once & pass down ---------------- */

export default function CourseTabsScreen({ route }: any) {
  const { courseId, activityId, studentId: studentIdParam, title: titleFromNav } = route.params ?? {};
  const { token, user } = useAuth();

  const studentId = studentIdParam ?? user?.id; // adjust to your auth shape if needed

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [course, setCourse] = useState<NormalizedCourse | null>(null);
  const [media, setMedia] = useState<{ images: ActivityFile[]; docs: ActivityFile[] }>({ images: [], docs: [] });
  const [certificate, setCertificate] = useState<CertificatePreviewProps | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!courseId) {
        setErr('لا يوجد معرّف للدورة.');
        setLoading(false);
        return;
      }
      if (!activityId) {
        setErr('لا يوجد معرّف للنشاط (activityId).');
        setLoading(false);
        return;
      }

      try {
        setLoading(true); setErr(null);
      
        let mergedCourse: NormalizedCourse | null = null;
        try {
          const courseJson = await api.fetchCourseById(token ?? undefined, String(courseId));
          if (!courseJson?.ok || !courseJson?.course) throw new Error('bad course payload');
          const norm = normalizeCourse(courseJson);
          mergedCourse = { ...norm, title: titleFromNav || norm.title };
          setCourse(mergedCourse);
        } catch (e: any) {
          console.log('❌ COURSE fetch failed:', e?.message, e);
          throw new Error('COURSE fetch failed: ' + (e?.message ?? ''));
        }
      
        let images: ActivityFile[] = [], docs: ActivityFile[] = [];
        try {
          const filesJson = await api.fetchActivityFiles(token ?? undefined, String(activityId));
          ({ images, docs } = splitActivityFiles(filesJson.files || []));
          setMedia({ images, docs });
        } catch (e: any) {
          console.log('❌ FILES fetch failed:', e?.message, e);
          // don't block the screen if media fails
          setMedia({ images: [], docs: [] });
        }
      
        try {
          if (studentId) {
            const certJson = await api.fetchCertificateByStudentActivity(token ?? undefined, String(activityId), String(studentId));
            const cert = normalizeCertificateForPreview(certJson);
            setCertificate(cert);
          }
        } catch (e: any) {
          console.log('❌ CERT fetch failed:', e?.message, e);
          // not fatal
          setCertificate(undefined);
        }
      } catch (e: any) {
        console.error('❌ CourseTabsScreen load error:', e);
        setErr(e?.message || 'حدث خطأ غير متوقع');
        setCourse(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [courseId, activityId, studentId, token, titleFromNav]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0f4f30" />
      </View>
    );
  }

  if (err || !course) {
    return (
      <View style={styles.center}>
        <Text style={{ fontFamily: 'NotoKufiArabic-Regular', color: '#b00020' }}>
          {err || 'تعذّر جلب البيانات.'}
        </Text>
      </View>
    );
  }

  const { title, descriptionHtml, meta } = course;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: { backgroundColor: '#0f4f30' },
        tabBarStyle: { backgroundColor: '#eceadf' },
        tabBarLabelStyle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="Details"
        component={DetailsTab}
        options={{ title: 'التفاصيل' }}
        initialParams={{ title, descriptionHtml, meta }}
      />

      <Tab.Screen
        name="Media"
        component={MediaTab}
        options={{ title: 'الوسائط' }}
        initialParams={{ images: media.images, docs: media.docs }}
      />

      <Tab.Screen
        name="Certificate"
        component={CertificateTab}
        options={{ title: 'الشهادة' }}
        initialParams={{ certificate }}
      />
    </Tab.Navigator>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  h1: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 16, color: '#111' },
  meta: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 12, color: '#666', marginTop: 6 },
  body: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 14, color: '#444', lineHeight: 22, marginTop: 10 },
  bodySmall: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 13, color: '#444', marginTop: 6 },

  segmented: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#eee',
    borderRadius: 999,
    padding: 4,
    marginTop: 10,
  },
  segBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, marginHorizontal: 2 },
  segBtnActive: { backgroundColor: '#0f4f30' },
  segText: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 12, color: '#333' },
  segTextActive: { color: '#eceadf' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  thumb: { width: 110, height: 110, borderRadius: 12, backgroundColor: '#ddd' },

  fileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eceadf',
  },
  fileTitle: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 13, color: '#0f4f30' },
  fileMeta: { fontFamily: 'NotoKufiArabic-Regular', fontSize: 11, color: '#666', marginTop: 4 },

  center: { flex: 1, backgroundColor: '#fff1e2', alignItems: 'center', justifyContent: 'center', padding: 16 },
  loader: { flex: 1, backgroundColor: '#fff1e2', alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyText: { fontFamily: 'NotoKufiArabic-Regular', color: '#666' },
});


