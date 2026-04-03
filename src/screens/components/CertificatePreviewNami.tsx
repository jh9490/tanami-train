// src/components/CertificatePreviewNami.tsx
import React, { useMemo } from 'react';
import {
  View,
  Image,
  ImageBackground,
  Text,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
  I18nManager,
} from 'react-native';

const BASE_W = 1080;
const BASE_H = 1620;

type Lang = 'ar' | 'en';

type Props = {
  /** optional; if omitted we auto-pick from phone language */
  lang?: Lang;
  name: string;
  course: string;
  hours?: number | null;
  grade?: string | null;   // "Excellent" | "Very Good" | "Good"
  date?: string | null;
  serial?: string | null;
  qrSource?: ImageSourcePropType;
  bgSource?: ImageSourcePropType;
  width?: number;
};

const DEFAULT_BG = require('../../assets/certificates/nami.jpg');

// --- helpers ---
function mapGrade(grade: string | null | undefined, lang: Lang): string | null {
  if (!grade) return null;
  const g = grade.trim().toLowerCase();
  if (lang === 'ar') {
    if (g === 'excellent') return 'ممتاز';
    if (g === 'very good') return 'جيد جدًا';
    if (g === 'good')      return 'جيد';
    return grade;
  }
  // English (normalize)
  if (g === 'excellent') return 'Excellent';
  if (g === 'very good') return 'Very Good';
  if (g === 'good')      return 'Good';
  return grade;
}
function digitalLabel(lang: 'ar' | 'en') {
  return lang === 'ar' ? 'نسخة رقمية' : 'Digital Copy';
}
const gradeLabel = (lang: Lang)  => (lang === 'ar' ? 'التقدير :' : 'Grade:');
const hoursSuffix = (lang: Lang) => (lang === 'ar' ? ' ساعة تدريبية' : ' training hours');

export default function CertificatePreviewNami({
  lang: langProp,
  name,
  course,
  hours,
  grade,
  date,
  serial,
  qrSource,
  bgSource = DEFAULT_BG,
  width,
}: Props) {
  // 👇 auto-pick language based on the phone layout direction
  const deviceIsRTL = I18nManager.isRTL;
  const lang: Lang = langProp ?? (deviceIsRTL ? 'ar' : 'en');

  const W = width ?? Math.min(Dimensions.get('window').width - 32, 480);
  const H = (W / BASE_W) * BASE_H;
  const px = (n: number) => (n / BASE_W) * W;

  const fsName   = px(70);
  const fsCourse = px(44);
  const fsHours  = px(40);
  const fsGrade  = px(44);

  const gradeText = mapGrade(grade, lang);
  const hoursText = hours != null ? `${hours}${hoursSuffix(lang)}` : null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: W,
          height: H,
          borderRadius: 16,
          overflow: 'hidden',
          alignSelf: 'center',
          backgroundColor: '#fff',
        },

        // Center stack (title area)
        centerWrap: {
          position: 'absolute',
          top: px(520),
          left: px(90),
          right: px(90),
          alignItems: 'center',
        },
        name: {
          fontFamily: 'NotoKufiArabic-Bold',
          color: '#096b4b',
          fontSize: fsName,
          textAlign: 'center',
        },
        course: {
          marginTop: px(26),
          fontFamily: 'NotoKufiArabic-Bold',
          color: '#0f4f30',
          fontSize: fsCourse,
          textAlign: 'center',
        },
        hours: {
          marginTop: px(18),
          fontFamily: 'NotoKufiArabic-Bold',
          color: '#0e8b62',
          fontSize: fsHours,
          textAlign: 'center',
        },
        grade: {
          marginTop: px(22),
          fontFamily: 'NotoKufiArabic-Bold',
          color: '#a78b61',
          fontSize: fsGrade,
          textAlign: 'center',
        },

        // ✅ QR always in the left white box on the background
        qr: {
          position: 'absolute',
          ...(deviceIsRTL ? { right: px(120) } : { left: px(210) }),
          bottom: px(110),
          width: px(204),
          height: px(204),
          borderRadius: px(16),
        },

        // ✅ Serial & Date: right side for Arabic, left side for English
        serial: {
          position: 'absolute',
          left: px(160),
          bottom: px(50),
          fontFamily: 'NotoKufiArabic-Bold',
          color: '#ffffff',
          fontSize: px(28),
          textAlign: lang === 'ar' ? 'right' : 'left',
          textShadowColor: 'rgba(0,0,0,0.35)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
        date: {
          position: 'absolute',
          left: px(160),
          bottom: px(100),
          fontFamily: 'NotoKufiArabic-Bold',
          color: '#ffffff',
          fontSize: px(28),
          textAlign: lang === 'ar' ? 'right' : 'left',
          textShadowColor: 'rgba(0,0,0,0.35)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },

        // For English lines, force LTR text flow to avoid Arabic shaping rules
        ltr: { writingDirection: 'ltr', textAlign: 'center' },

        digitalTag: {
          position: 'absolute',
          bottom: px(24),          // sits above the bottom edge
          left: 0,
          right: 0,
          alignItems: 'center',
        },
        digitalText: {
          fontFamily: 'NotoKufiArabic-Bold',
          fontSize: px(22),
          color: '#0f4f30',
          opacity: 0.7,
          backgroundColor: 'rgba(255,255,255,0.65)',
          paddingHorizontal: px(12),
          paddingVertical: px(6),
          borderRadius: px(12),
          overflow: 'hidden',
        },
      }),
    [W, H, lang]
  );

  const maybeLTR = lang === 'en' ? styles.ltr : undefined;

  return (
    <View style={styles.card}>
      <ImageBackground source={bgSource} style={{ width: W, height: H }}>
        <View style={styles.centerWrap}>
          <Text style={[styles.name, maybeLTR]} numberOfLines={1} adjustsFontSizeToFit>
            {name || '-'}
          </Text>

          <Text
            style={[styles.course, maybeLTR]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {course || '-'}
          </Text>

          {hoursText ? (
            <Text style={[styles.hours, maybeLTR]} numberOfLines={1} adjustsFontSizeToFit>
              {hoursText}
            </Text>
          ) : null}

          {gradeText ? (
            <Text style={[styles.grade, maybeLTR]} numberOfLines={1} adjustsFontSizeToFit>
              {`${gradeLabel(lang)} ${gradeText}`}
            </Text>
          ) : null}
        </View>

        {qrSource ? <Image source={qrSource} style={styles.qr} resizeMode="contain" /> : null}

        {serial ? (
          <Text style={styles.serial} numberOfLines={1} adjustsFontSizeToFit>
            {serial}
          </Text>
        ) : null}

        {date ? (
          <Text style={styles.date} numberOfLines={1} adjustsFontSizeToFit>
            {date}
          </Text>
        ) : null}
        <View style={styles.digitalTag}>
          <Text style={styles.digitalText}>{digitalLabel(lang)}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}
