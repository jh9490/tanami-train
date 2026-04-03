// screens/CourseTabsScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Share,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CertificatePreviewNami from './components/CertificatePreviewNami';

const Tab = createMaterialTopTabNavigator();

/* ---------------- Types matching your APIs ---------------- */
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

type CertApiV2 = {
  ok: boolean;
  certificate?: {
    id: number;
    certificate_id?: string;
    serial?: string;
    date?: string;             // "YYYY-MM-DD"
    status?: number;           // 0/1
    grade?: string | null;     // "Excellent" | "Very Good" | "Good"
    student?: { id: number; name_ar?: string; name_en?: string };
    activity?: {
      is_activity_id: number;
      activity_id: number;
      course_name_ar?: string;
      course_name_en?: string;
      hours?: number;
    };
  };
};

/* ---------------- Helpers ---------------- */
type NormalizedCourse = {
  title: string;
  descriptionHtml?: string;
  meta?: { days?: number; hours?: number; cost?: number };
};
function normalizeCourse(json: GetCourseResponse, titleFromNav?: string): NormalizedCourse {
  const c = json.course!;
  const title = titleFromNav || c.name_ar || c.name_en || c.name || 'الدورة';
  return {
    title,
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

/** Adapt the new cert API → props for CertificatePreviewNami AR/EN */
function normalizeCertForPreviews(cert?: CertApiV2['certificate']) {
  if (!cert) return undefined;

  const arName = cert.student?.name_ar || '-';
  const enName = cert.student?.name_en || '-';
  const courseAr = cert.activity?.course_name_ar || '-';
  const courseEn = cert.activity?.course_name_en || '-';
  const hours = cert.activity?.hours ?? undefined;

  return {
    serial: cert.serial,
    date: cert.date,
    grade: cert.grade ?? undefined,
    hours,
    arName,
    enName,
    courseAr,
    courseEn,
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
  // props passed via initialParams
  const { certPack } = route.params as {
    certPack?: {
      serial?: string | null;
      date?: string | null;
      grade?: string | null;
      hours?: number | null | undefined;
      arName: string;
      enName: string;
      courseAr: string;
      courseEn: string;
    };
  };

  // Refs to capture views
  const arShotRef = useRef<View>(null);
  const enShotRef = useRef<View>(null);

  const saveImage = async (ref: React.RefObject<View>) => {
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
      await  CameraRoll.save(uri, { type: 'photo' });
      Alert.alert('تم الحفظ', 'تم حفظ الصورة في الاستوديو.');
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'تعذر حفظ الصورة.');
    }
  };

  const shareImage = async (ref: React.RefObject<View>) => {
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
      await Share.share({ url: uri, message: 'Tanami Train Certificate' });
    } catch {
      // user may cancel
    }
  };

  const ActionRow = ({ onSave, onShare }: { onSave: () => void; onShare: () => void }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 12 }}>
      <TouchableOpacity style={styles.primaryBtn} onPress={onSave}>
        <Text style={styles.primaryText}>حفظ كصورة</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#145a43' }]} onPress={onShare}>
        <Text style={styles.primaryText}>مشاركة</Text>
      </TouchableOpacity>
    </View>
  );

  if (!certPack) {
    return (
      <View style={styles.center}>
        <Text style={styles.h1}>شهادتي</Text>
        <Text style={styles.bodySmall}>لا توجد شهادة متاحة لهذا النشاط.</Text>
      </View>
    );
  }

  const { serial, date, grade, hours, arName, enName, courseAr, courseEn } = certPack;

  const qrUri = serial
    ? `https://tanamitrain.com/tanamiAdmin/api/certi/qr?serial=${encodeURIComponent(serial)}&s=5&qz=2`
    : undefined;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff1e2', padding: 16 }} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Arabic certificate */}
      <ViewShot ref={arShotRef} options={{ format: 'png', quality: 1 }}>
        <CertificatePreviewNami
          lang="ar"
          name={arName}
          course={courseAr}
          hours={hours ?? undefined}
          grade={grade ?? undefined}     // auto-mapped to Arabic inside component
          date={date ?? undefined}
          serial={serial ?? undefined}
          qrSource={qrUri ? { uri: qrUri } : undefined}
        />
      </ViewShot>
      <ActionRow onSave={() => saveImage(arShotRef)} onShare={() => shareImage(arShotRef)} />

      <View style={{ height: 24 }} />

      {/* English certificate */}
      <ViewShot ref={enShotRef} options={{ format: 'png', quality: 1 }}>
        <CertificatePreviewNami
          lang="en"
          name={enName}
          course={courseEn}
          hours={hours ?? undefined}
          grade={grade ?? undefined}     // stays in English
          date={date ?? undefined}
          serial={serial ?? undefined}
          qrSource={qrUri ? { uri: qrUri } : undefined}
        />
      </ViewShot>
      <ActionRow onSave={() => saveImage(enShotRef)} onShare={() => shareImage(enShotRef)} />

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

/* ---------------- Parent: fetch once & pass down ---------------- */

export default function CourseTabsScreen({ route }: any) {
  const { courseId, activityId, studentId: studentIdParam, title: titleFromNav } = route.params ?? {};
  const { token, user } = useAuth();
  const studentId = studentIdParam ?? user?.id;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [course, setCourse] = useState<NormalizedCourse | null>(null);
  const [media, setMedia] = useState<{ images: ActivityFile[]; docs: ActivityFile[] }>({ images: [], docs: [] });
  const [certPack, setCertPack] = useState<ReturnType<typeof normalizeCertForPreviews> | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        if (!courseId) throw new Error('لا يوجد معرّف للدورة.');
        if (!activityId) throw new Error('لا يوجد معرّف للنشاط (activityId).');

        setLoading(true);
        setErr(null);

        // 1) Course
        const courseJson: GetCourseResponse = await api.fetchCourseById(token ?? undefined, String(courseId));
        if (!courseJson?.ok || !courseJson?.course) throw new Error('تعذر جلب بيانات الدورة.');
        setCourse(normalizeCourse(courseJson, titleFromNav));

        // 2) Media (non-blocking if it fails)
        try {
          const filesJson = await api.fetchActivityFiles(token ?? undefined, String(activityId));
          const { images, docs } = splitActivityFiles(filesJson.files || []);
          setMedia({ images, docs });
        } catch {
          setMedia({ images: [], docs: [] });
        }

        // 3) Certificate (new v2 fields with AR/EN names)
        if (studentId) {
          try {
            // Make sure your api method calls the updated endpoint that returns name_ar/name_en & course_name_ar/course_name_en
            const certJson: CertApiV2 = await api.fetchCertificateByStudentActivity(token ?? undefined, String(activityId), String(studentId));
            const normalized = normalizeCertForPreviews(certJson?.certificate);
            setCertPack(normalized);
          } catch {
            setCertPack(undefined);
          }
        } else {
          setCertPack(undefined);
        }
      } catch (e: any) {
        setErr(e?.message || 'حدث خطأ غير متوقع');
        setCourse(null);
      } finally {
        setLoading(false);
      }
    })();
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
        initialParams={{ certPack }}
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

  primaryBtn: {
    backgroundColor: '#0f4f30',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  primaryText: { color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold' },
});
