import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { api, ApiError } from '../../services/api';
import {
  canRequestOnlineRegistration,
  canRequestCourseRegistration,
  registrationErrorMessage,
} from '../../util/courseRegistration';
import {
  buildRegistrationPricingMessage,
  formatFee,
  getPricingLabels,
  type ActivityType,
} from '../../util/activityPricing';

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
  activityType?: ActivityType;
  certificateCost?: number | null;
  registrationOpen?: boolean;
  allowJoinAfterStart?: boolean;
};

type BaseProps = {
  visible: boolean;
  course: CourseLite | null;
  onClose: () => void;
  isAuthenticated: boolean;
  token?: string | null;
  onRegistrationChanged?: () => void | Promise<void>;
  onActivityUnavailable?: (activityId: string, reason: 'deleted' | 'closed') => void | Promise<void>;
  onOnlineUnavailable?: (activityId: string) => void;
  onUnauthorized?: () => void | Promise<void>;
  courseSequence?: CourseLite[];
  onCourseChange?: (course: CourseLite) => void;
};

type Tabs = 'head' | 'details' | 'poster' | 'register';

type Props = BaseProps & {
  /** Control which tabs to show. Defaults to all (incl. register if authenticated). */
  enabledTabs?: Array<Tabs>;
  /** Tab shown whenever a course is opened. Defaults to headlines. */
  initialTab?: Tabs;
  /** Limit course details to the backend duration fields. */
  durationOnlyDetails?: boolean;
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
  initialTab = 'head',
  durationOnlyDetails = false,
  onRegistrationChanged,
  onActivityUnavailable,
  onOnlineUnavailable,
  onUnauthorized,
  courseSequence = [],
  onCourseChange,
}: Props) {
  const registrationEnabled = canRequestCourseRegistration(
    isAuthenticated,
    course?.registrationOpen,
  );
  const showRegistrationTab = isAuthenticated;
  const [onlineRejected, setOnlineRejected] = useState(false);
  const onlineEnabled = canRequestOnlineRegistration(course?.live) && !onlineRejected;
  const defaultTabs: Tabs[] = [
    'head',
    'details',
    'poster',
    ...(showRegistrationTab ? (['register'] as const) : []),
  ];
  const tabs: Tabs[] = (enabledTabs?.length ? enabledTabs : defaultTabs).filter(
    candidate => candidate !== 'register' || showRegistrationTab,
  );

  const [tab, setTab] = useState<Tabs>(initialTab);
  const [mode, setMode] = useState<'onsite' | 'online'>('onsite');
  const [certificateRequested, setCertificateRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const c = course;
  const activityType = c?.activityType ?? 'course';
  const isInitiative = activityType === 'initiative';
  const pricingLabels = getPricingLabels('ar');
  const bullets = useMemo(() => cleanToBullets(c?.headLines), [c?.headLines]);
  const goToAdjacentCourse = useCallback(
    (direction: -1 | 1) => {
      if (!course || !onCourseChange || courseSequence.length < 2) return;
      const currentIndex = courseSequence.findIndex(item => item.id === course.id);
      if (currentIndex < 0) return;
      const nextIndex = (currentIndex + direction + courseSequence.length) % courseSequence.length;
      onCourseChange(courseSequence[nextIndex]);
    },
    [course, courseSequence, onCourseChange],
  );
  const courseSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          courseSequence.length > 1 &&
          Math.abs(gesture.dx) > 10 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          courseSequence.length > 1 &&
          Math.abs(gesture.dx) > 10 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < 35) return;
          goToAdjacentCourse(gesture.dx < 0 ? 1 : -1);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [courseSequence.length, goToAdjacentCourse],
  );

  useEffect(() => {
    if (!visible) return;
    setTab(tabs.includes(initialTab) ? initialTab : tabs[0]);
    setMode('onsite');
    setCertificateRequested(false);
    setOnlineRejected(false);
  // Reset the dialog for each newly opened course. The enabled tab list is
  // supplied declaratively by the caller and does not need to trigger a reset.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.id, initialTab, visible]);

  if (!visible || !c) return null;

  const title = c.nameAr || c.title || '—';

  const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
    <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
      <Text style={{ width: 110, color: '#0f4f30', fontFamily: 'NotoKufiArabic-Bold', fontSize: 12 }}>{label}</Text>
      <Text style={{ flex: 1, color: '#0f4f30', fontFamily: 'NotoKufiArabic-Regular', fontSize: 12 }}>
        {value === 0 || value ? String(value) : '—'}
      </Text>
    </View>
  );

  const submitRegistration = async () => {
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
      const refreshed = await api.getActivity(activityId, token);
      const refreshedActivity =
        (refreshed as any)?.activity ??
        (refreshed as any)?.item ??
        (refreshed as any)?.data ??
        (refreshed as any)?.result ??
        refreshed;
      if (refreshedActivity?.registration_open !== true) {
        await onActivityUnavailable?.(c.id, 'closed');
        onClose();
        Alert.alert(
          'التسجيل غير متاح',
          'التسجيل غير متاح بعد بدء النشاط\nRegistration is unavailable after the activity has started.',
        );
        return;
      }
      const online = mode === 'online' && onlineEnabled ? 1 : 0;
      const res = await api.registerForActivity(
        token,
        activityId,
        online as 0 | 1,
        isInitiative ? certificateRequested : undefined,
      );
      const ok = (res as any)?.ok;
      const msg =
        ok && (res as any).message === 'already_exists'
          ? 'لديك طلب سابق لهذا النشاط. تم تحديث تفضيل (أونلاين/حضوري) إن لزم.'
          : ok
            ? 'تم إرسال طلب التسجيل بنجاح.'
            : (res as any)?.error || (res as any)?.message || 'تعذر إرسال الطلب.';
      Alert.alert(ok ? 'تم' : 'خطأ', msg);
      if (ok) {
        await onRegistrationChanged?.();
        onClose();
      }
    } catch (e: any) {
      if (e instanceof ApiError) {
        if (e.status === 401 || e.code === 'unauthorized') {
          await onUnauthorized?.();
        } else if (e.status === 404 || e.code === 'activity_not_found') {
          await onActivityUnavailable?.(c.id, 'deleted');
          onClose();
        } else if (e.status === 409 || e.code === 'activity_not_open_for_registration') {
          await onActivityUnavailable?.(c.id, 'closed');
          onClose();
        } else if (e.status === 422 && e.code === 'online_registration_unavailable') {
          setOnlineRejected(true);
          setMode('onsite');
          onOnlineUnavailable?.(c.id);
        }
      }
      Alert.alert('تعذر التسجيل', registrationErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = () => {
    const message = buildRegistrationPricingMessage({
      activityType,
      activityFee: c.cost ?? null,
      certificateFee: c.certificateCost ?? null,
    });
    const certificateChoice = isInitiative
      ? `\n${certificateRequested ? 'تم اختيار طلب شهادة.' : 'لم يتم اختيار طلب شهادة.'}`
      : '';

    Alert.alert('تأكيد التسجيل', `${message}${certificateChoice}`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تأكيد وإرسال', onPress: () => void submitRegistration() },
    ]);
  };

  // Build tab list UI entries based on `tabs`
  const tabEntries = [
    { k: 'head' as const, t: 'العناوين' },
    { k: 'details' as const, t: 'التفاصيل' },
    { k: 'poster' as const, t: 'الملصق' },
    ...(showRegistrationTab ? [{ k: 'register' as const, t: 'التسجيل' }] : []),
  ].filter((t) => tabs.includes(t.k));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 18 }}>
          <View
            {...courseSwipeResponder.panHandlers}
            style={{ backgroundColor: '#fff1e2', borderRadius: 22, overflow: 'hidden', maxHeight: '96%' }}
          >
            {/* Poster-led movie-style header */}
            <ImageBackground
              source={c.image ? { uri: c.image } : undefined}
              resizeMode="cover"
              style={{ height: c.image ? 270 : 160, backgroundColor: '#0f4f30' }}
            >
              <LinearGradient
                colors={['rgba(12,42,32,0.08)', 'rgba(12,42,32,0.3)', 'rgba(12,42,32,0.96)']}
                style={{ flex: 1, justifyContent: 'space-between', padding: 16 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      borderRadius: 7,
                      backgroundColor: isInitiative ? '#cbae82' : 'rgba(12,42,32,0.92)',
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: isInitiative ? '#0c2a20' : '#fff',
                        fontFamily: 'NotoKufiArabic-Bold',
                        fontSize: 11,
                      }}
                    >
                      {isInitiative ? 'مبادرة' : 'دورة'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="إغلاق"
                    onPress={onClose}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 20, lineHeight: 22 }}>×</Text>
                  </TouchableOpacity>
                </View>
                {courseSequence.length > 1 ? (
                  <View
                    pointerEvents="box-none"
                    style={{
                      position: 'absolute',
                      top: '42%',
                      left: 10,
                      right: 10,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="الدورة السابقة"
                      onPress={() => goToAdjacentCourse(-1)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 28, lineHeight: 30 }}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="الدورة التالية"
                      onPress={() => goToAdjacentCourse(1)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 28, lineHeight: 30 }}>›</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                <View>
                  <Text
                    style={{ color: '#fff', fontFamily: 'NotoKufiArabic-Bold', fontSize: 19, lineHeight: 30, textAlign: 'right' }}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                  <Text
                    style={{ color: 'rgba(255,255,255,0.78)', fontFamily: 'NotoKufiArabic-Regular', fontSize: 11, textAlign: 'right' }}
                  >
                    {[c.date, c.days ? `${c.days} أيام` : null].filter(Boolean).join('  •  ')}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>

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
                    {!durationOnlyDetails && (
                      <>
                        <InfoRow label="التاريخ" value={c.date} />
                        <InfoRow label="تاريخ الانتهاء" value={c.endDate} />
                        <InfoRow label="الحالة" value={c.live ? 'مباشر' : '—'} />
                        <InfoRow
                          label={pricingLabels.activityType}
                          value={isInitiative ? pricingLabels.initiative : pricingLabels.course}
                        />
                        <InfoRow label={pricingLabels.activityFee} value={`${formatFee(c.cost ?? null)} ل.س`} />
                        {isInitiative && (
                          <>
                            <InfoRow
                              label={pricingLabels.certificateFee}
                              value={`${formatFee(c.certificateCost ?? null)} ل.س`}
                            />
                            <Text
                              style={{
                                color: '#0f4f30',
                                fontFamily: 'NotoKufiArabic-Regular',
                                fontSize: 11,
                                lineHeight: 18,
                                textAlign: 'center',
                                marginTop: 8,
                              }}
                            >
                              {c.cost === 0 ? pricingLabels.separatePayment : pricingLabels.paidAttendance}
                            </Text>
                          </>
                        )}
                      </>
                    )}
                  </View>
                )}

                {/* poster */}
                {tab === 'poster' && tabs.includes('poster') && (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    {c.image ? (
                      <View style={{ width: '100%', height: 260, position: 'relative' }}>
                        <Image
                          source={{ uri: c.image }}
                          style={{ width: '100%', height: '100%', borderRadius: 8 }}
                          resizeMode="contain"
                        />
                        {isInitiative ? (
                          <View
                            pointerEvents="none"
                            style={{
                              position: 'absolute',
                              top: 12,
                              right: 0,
                              minWidth: 76,
                              paddingVertical: 7,
                              paddingHorizontal: 13,
                              borderTopLeftRadius: 12,
                              borderBottomLeftRadius: 12,
                              backgroundColor: '#cbae82',
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: '#0c2a20',
                                fontFamily: 'NotoKufiArabic-Bold',
                                fontSize: 11,
                              }}
                            >
                              مبادرة
                            </Text>
                          </View>
                        ) : null}
                      </View>
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
                  <ScrollView
                    showsVerticalScrollIndicator
                    style={{
                      marginTop: 6,
                      borderWidth: 1,
                      borderColor: '#eadac3',
                      borderRadius: 10,
                      backgroundColor: '#f7efe5',
                      flex: 1,
                    }}
                    contentContainerStyle={{
                      padding: 10,
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

                    <Text
                      style={{
                        color: '#0f4f30',
                        fontFamily: 'NotoKufiArabic-Regular',
                        fontSize: 11,
                        lineHeight: 18,
                        marginBottom: 10,
                        textAlign: 'center',
                      }}
                    >
                      {buildRegistrationPricingMessage({
                        activityType,
                        activityFee: c.cost ?? null,
                        certificateFee: c.certificateCost ?? null,
                      })}
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
                        ...(onlineEnabled ? [{ k: 'online' as const, t: 'أونلاين' }] : []),
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

                    {isInitiative && (
                      <View style={{ marginBottom: 12 }}>
                        <TouchableOpacity
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: certificateRequested }}
                          onPress={() => setCertificateRequested(value => !value)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}
                        >
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: '#0f4f30',
                              backgroundColor: certificateRequested ? '#0f4f30' : 'transparent',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {certificateRequested && (
                              <Text style={{ color: '#fff', fontSize: 15, lineHeight: 17 }}>✓</Text>
                            )}
                          </View>
                          <Text
                            style={{
                              color: '#0f4f30',
                              fontFamily: 'NotoKufiArabic-Bold',
                              fontSize: 12,
                            }}
                          >
                            أرغب في الحصول على شهادة
                          </Text>
                        </TouchableOpacity>

                        <Text
                          style={{
                            color: '#6b5d4d',
                            fontFamily: 'NotoKufiArabic-Regular',
                            fontSize: 10,
                            lineHeight: 17,
                            textAlign: 'center',
                            marginTop: 7,
                          }}
                        >
                          الحضور لا يتطلب شراء الشهادة. سيتم دفع رسوم الشهادة بشكل منفصل.
                        </Text>

                        {certificateRequested && (
                          <View style={{ marginTop: 7 }}>
                            {c.certificateCost !== null && c.certificateCost !== undefined && (
                              <Text
                                style={{
                                  color: '#0f4f30',
                                  fontFamily: 'NotoKufiArabic-Bold',
                                  fontSize: 11,
                                  textAlign: 'center',
                                }}
                              >
                                رسوم الشهادة: {formatFee(c.certificateCost)} ل.س
                              </Text>
                            )}
                            <Text
                              style={{
                                color: '#8a5a20',
                                fontFamily: 'NotoKufiArabic-Regular',
                                fontSize: 10,
                                lineHeight: 17,
                                textAlign: 'center',
                                marginTop: 4,
                              }}
                            >
                              ملاحظة: أولوية القبول للطلاب الراغبين في الحصول على شهادة.
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={{ alignItems: 'center' }}>
                      {!registrationEnabled && (
                        <Text
                          style={{
                            color: '#8a5a20',
                            fontFamily: 'NotoKufiArabic-Regular',
                            fontSize: 11,
                            lineHeight: 18,
                            textAlign: 'center',
                            marginBottom: 10,
                          }}
                        >
                          {'التسجيل غير متاح بعد بدء النشاط\nRegistration is unavailable after the activity has started.'}
                        </Text>
                      )}
                      <TouchableOpacity
                        onPress={handleRegister}
                        disabled={submitting || !registrationEnabled}
                        style={{
                          backgroundColor: '#0f4f30',
                          paddingVertical: 10,
                          paddingHorizontal: 18,
                          borderRadius: 10,
                          opacity: submitting || !registrationEnabled ? 0.5 : 1,
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
                  </ScrollView>
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
