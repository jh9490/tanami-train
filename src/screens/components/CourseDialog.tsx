import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../services/api';

export type CourseLite = {
  id: string;
  title: string;
  image?: string | null;
  headLines: string;
  nameAr?: string | null;
  days?: number | null;
  hours?: number | null;
  date?: string | null;
  endDate?: string | null;
  live?: boolean | null;
  cost?: number | null;
};

type BaseProps = {
  visible: boolean;
  course: CourseLite | null;
  onClose: () => void;
  isAuthenticated: boolean;
  token?: string | null;
};

type Tabs = 'head' | 'details' | 'poster' | 'register';

type Props = BaseProps & {
  /** Control which tabs to show. Defaults to all (incl. register if authenticated). */
  enabledTabs?: Array<Tabs>;
};

const cleanToBullets = (raw?: string | null): string[] => {
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
  s = s.replace(/[;•·]+/g, '\n').replace(/\u00A0/g, ' ').replace(/\r/g, '').replace(/\n{2,}/g, '\n').trim();
  return s
    .split('\n')
    .map((l) => l.replace(/^\s*[-–*]\s*/, '').trim())
    .filter((l) => l.length > 0);
};

export default function CourseDialog({
  visible,
  course,
  onClose,
  isAuthenticated,
  token,
  enabledTabs,
}: Props) {
  // default tabs: show all (register only if authenticated)
  const defaultTabs: Tabs[] = ['head', 'details', 'poster', ...(isAuthenticated ? (['register'] as const) : [])];
  const tabs: Tabs[] = enabledTabs?.length ? enabledTabs : defaultTabs;

  const [tab, setTab] = useState<Tabs>('head');
  const [mode, setMode] = useState<'onsite' | 'online'>('onsite');
  const [submitting, setSubmitting] = useState(false);

  const c = course;
  const bullets = useMemo(() => cleanToBullets(c?.headLines), [c?.headLines]);
  if (!visible || !c) return null;

  // Make sure current tab is allowed (e.g., when enabledTabs changes)
  if (!tabs.includes(tab)) setTab(tabs[0]);

  const title = c.nameAr || c.title || '—';

  const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
    <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
      <Text style={{ width: 110, color: '#0f4f30', fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 }}>{label}</Text>
      <Text style={{ flex: 1, color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular', fontSize: 12 }}>
        {value === 0 || value ? String(value) : '—'}
      </Text>
    </View>
  );

  const handleRegister = async () => {
    if (!token) {
      Alert.alert('مطلوب تسجيل الدخول', 'الرجاء تسجيل الدخول لإرسال طلب التسجيل.');
      return;
    }
    const activityId = parseInt(c.id, 10);
    if (!Number.isFinite(activityId)) {
      Alert.alert('خطأ', 'معرّف النشاط غير صالح.');
      return;
    }
    setSubmitting(true);
    try {
      const online = mode === 'online' ? 1 : 0;
      const res = await api.registerForActivity(token, activityId, online as 0 | 1);
      const ok = (res as any)?.ok;
      const msg =
        ok && (res as any).message === 'already_exists'
          ? 'لديك طلب سابق لهذا النشاط. تم تحديث تفضيل (أونلاين/حضوري) إن لزم.'
          : ok
            ? 'تم إرسال طلب التسجيل بنجاح.'
            : (res as any)?.error || (res as any)?.message || 'تعذر إرسال الطلب.';
      Alert.alert(ok ? 'تم' : 'خطأ', msg);
      if (ok) onClose();
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'تعذر إرسال الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  // Build tab list UI entries based on `tabs`
  const tabEntries = [
    { k: 'head' as const, t: 'العناوين' },
    { k: 'details' as const, t: 'التفاصيل' },
    { k: 'poster' as const, t: 'الملصق' },
    ...(isAuthenticated ? [{ k: 'register' as const, t: 'التسجيل' }] : []),
  ].filter((t) => tabs.includes(t.k));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18 }}>
          <View style={{ backgroundColor: '#fff1e2', borderRadius: 16, overflow: 'hidden', maxHeight: '82%' }}>
            {/* header */}
            <View style={{ padding: 14, backgroundColor: '#0f4f30' }}>
              <Text
                style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold', fontSize: 14, textAlign: 'center' }}
                numberOfLines={2}
              >
                {title}
              </Text>
            </View>

            {/* tabs */}
            {tabEntries.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 4 }}
                style={{ marginTop: 10, marginBottom: 6 }}
              >
                <View style={{ flexDirection: 'row', backgroundColor: '#eee', borderRadius: 999, padding: 4 }}>
                  {tabEntries.map(({ k, t }) => {
                    const active = tab === k;
                    return (
                      <TouchableOpacity
                        key={k}
                        onPress={() => setTab(k)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 14,
                          borderRadius: 999,
                          backgroundColor: active ? '#0f4f30' : 'transparent',
                          marginHorizontal: 2,
                        }}
                      >
                        <Text
                          style={{
                            color: active ? '#eceadf' : '#333',
                            fontFamily: 'NotoKufiArabic-Bold',
                            fontSize: 12,
                          }}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* content */}
            <View style={{ paddingHorizontal: 14, paddingBottom: 8 }}>
              <View style={{ height: 300 }}>
                {/* headlines */}
                {tab === 'head' && (
                  <ScrollView contentContainerStyle={{ paddingVertical: 8, paddingBottom: 40 }} showsVerticalScrollIndicator>
                    {bullets.length ? (
                      bullets.map((b, i) => (
                        <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
                          <Text style={{ color: '#0f4f30', marginLeft: 6 }}>•</Text>
                          <Text
                            style={{ flex: 1, color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular', fontSize: 12, lineHeight: 18 }}
                          >
                            {b}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text
                        style={{ color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular', fontSize: 12, textAlign: 'center' }}
                      >
                        لا توجد تفاصيل لعرضها
                      </Text>
                    )}
                  </ScrollView>
                )}

                {/* details */}
                {tab === 'details' && tabs.includes('details') && (
                  <View style={{ paddingVertical: 8, flex: 1 }}>
                    <InfoRow label="عدد الأيام" value={c.days} />
                    <InfoRow label="عدد الساعات" value={c.hours} />
                    <InfoRow label="التاريخ" value={c.date} />
                    <InfoRow label="تاريخ الانتهاء" value={c.endDate} />
                    <InfoRow label="الحالة" value={c.live ? 'مباشر' : '—'} />
                    <InfoRow label="التكلفة" value={typeof c.cost === 'number' ? `${c.cost} ل.س` : '—'} />
                  </View>
                )}

                {/* poster */}
                {tab === 'poster' && tabs.includes('poster') && (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    {c.image ? (
                      <Image source={{ uri: c.image }} style={{ width: '100%', height: 260, borderRadius: 8 }} resizeMode="contain" />
                    ) : (
                      <Text
                        style={{ color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular', fontSize: 12, textAlign: 'center' }}
                      >
                        لا يوجد ملصق
                      </Text>
                    )}
                  </View>
                )}

                {/* register */}
                {tab === 'register' && tabs.includes('register') && (
                  <View
                    style={{
                      marginTop: 6,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: '#eadac3',
                      borderRadius: 10,
                      backgroundColor: '#f7efe5',
                      flex: 1,
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: '#0f4f30',
                        fontFamily: 'NotoKufiArabic-Bold',
                        fontSize: 13,
                        marginBottom: 12,
                        textAlign: 'center',
                      }}
                    >
                      طلب تسجيل
                    </Text>

                    {/* حضوري / أونلاين */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignSelf: 'center',
                        backgroundColor: '#eee',
                        borderRadius: 999,
                        padding: 4,
                        marginBottom: 12,
                      }}
                    >
                      {[
                        { k: 'onsite' as const, t: 'حضوري' },
                        { k: 'online' as const, t: 'أونلاين' },
                      ].map(({ k, t }) => {
                        const active = mode === k;
                        return (
                          <TouchableOpacity
                            key={k}
                            onPress={() => setMode(k)}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 14,
                              borderRadius: 999,
                              backgroundColor: active ? '#0f4f30' : 'transparent',
                              marginHorizontal: 2,
                            }}
                          >
                            <Text
                              style={{
                                color: active ? '#eceadf' : '#333',
                                fontFamily: 'NotoKufiArabic-Bold',
                                fontSize: 12,
                              }}
                            >
                              {t}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={handleRegister}
                        disabled={submitting}
                        style={{
                          backgroundColor: '#0f4f30',
                          paddingVertical: 10,
                          paddingHorizontal: 18,
                          borderRadius: 10,
                          opacity: submitting ? 0.7 : 1,
                          minWidth: 160,
                          alignItems: 'center',
                        }}
                      >
                        {submitting ? (
                          <ActivityIndicator color="#eceadf" />
                        ) : (
                          <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 }}>
                            إرسال الطلب
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* footer */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                padding: 12,
                borderTopWidth: 1,
                borderTopColor: '#eadac3',
                gap: 10,
              }}
            >
              <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#0f4f30', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 }}>
                <Text style={{ color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 }}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
