// src/screens/AccountScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, TextInput,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Profile, UpdateProfileBody } from '../types/api';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isDate  = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const norm = (v: string) => {
  const t = (v || '').trim();
  return t === '' ? null : t;
};
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const fromYMD = (s?: string | null) => {
  if (!s || !isDate(s)) return new Date(2000, 0, 1);
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export default function AccountScreen() {
  const { user, token, signOut, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // keyboard padding (so buttons/fields don’t get covered)
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const sh = Keyboard.addListener('keyboardDidShow', (e) =>
      setKbHeight(e.endCoordinates?.height || 0)
    );
    const hd = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { sh.remove(); hd.remove(); };
  }, []);

  // form state
  const [fullname_ar, setFullnameAr] = useState('');
  const [fullname_en, setFullnameEn] = useState('');
  const [email, setEmail]           = useState('');
  const [title_ar, setTitleAr]      = useState('');
  const [title_en, setTitleEn]      = useState('');
  const [address_ar, setAddressAr]  = useState('');
  const [address_en, setAddressEn]  = useState('');
  const [date_of_birth, setDob]     = useState(''); // YYYY-MM-DD

  // Date picker
  const [showDobPicker, setShowDobPicker] = useState(false);

  // snapshot from server to diff against
  const [initial, setInitial] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!token) return;
        const res = await api.getProfile(token);
        if (!mounted) return;

        const p = res.profile ?? null;
        setInitial(p);

        setFullnameAr(p?.fullname_ar ?? '');
        setFullnameEn(p?.fullname_en ?? '');
        setEmail(p?.email ?? '');
        setTitleAr(p?.title_ar ?? '');
        setTitleEn(p?.title_en ?? '');
        setAddressAr(p?.address_ar ?? '');
        setAddressEn(p?.address_en ?? '');
        setDob(p?.date_of_birth ?? '');
      } catch {
        setInitial(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const changed = useMemo(() => {
    const curr: Record<string, string | null> = {
      fullname_ar: norm(fullname_ar),
      fullname_en: norm(fullname_en),
      email:       norm(email),
      title_ar:    norm(title_ar),
      title_en:    norm(title_en),
      address_ar:  norm(address_ar),
      address_en:  norm(address_en),
      date_of_birth: norm(date_of_birth),
    };
    const init: Record<string, string | null> = {
      fullname_ar: initial?.fullname_ar ?? null,
      fullname_en: initial?.fullname_en ?? null,
      email:       initial?.email ?? null,
      title_ar:    initial?.title_ar ?? null,
      title_en:    initial?.title_en ?? null,
      address_ar:  initial?.address_ar ?? null,
      address_en:  initial?.address_en ?? null,
      date_of_birth: initial?.date_of_birth ?? null,
    };
    return Object.keys(curr).some(k => curr[k] !== init[k]);
  }, [initial, fullname_ar, fullname_en, email, title_ar, title_en, address_ar, address_en, date_of_birth]);

  const buildPayload = (): UpdateProfileBody => {
    const pairs: Array<[keyof UpdateProfileBody, string | null]> = [
      ['fullname_ar', norm(fullname_ar)],
      ['fullname_en', norm(fullname_en)],
      ['email',       norm(email)],
      ['title_ar',    norm(title_ar)],
      ['title_en',    norm(title_en)],
      ['address_ar',  norm(address_ar)],
      ['address_en',  norm(address_en)],
      ['date_of_birth', norm(date_of_birth)],
    ];
    const diff: UpdateProfileBody = {};
    pairs.forEach(([k, v]) => {
      const prev = (initial as any)?.[k] ?? null;
      if (prev !== v) (diff as any)[k] = v;
    });
    return diff;
  };

  const handleSave = async () => {
    if (!token) return;

    if (email.trim() && !isEmail(email.trim())) {
      Alert.alert('تنبيه', 'صيغة البريد الإلكتروني غير صحيحة.');
      return;
    }
    if (date_of_birth.trim() && !isDate(date_of_birth.trim())) {
      Alert.alert('تنبيه', 'صيغة التاريخ يجب أن تكون YYYY-MM-DD مثل 1995-06-12.');
      return;
    }
    if (!initial && !fullname_ar.trim()) {
      Alert.alert('تنبيه', 'الاسم الكامل بالعربية مطلوب.');
      return;
    }

    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      Alert.alert('معلومة', 'لا توجد تغييرات للحفظ.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateProfile(token, payload);
      const p = res.profile;

      setInitial(p);
      setFullnameAr(p.fullname_ar ?? '');
      setFullnameEn(p.fullname_en ?? '');
      setEmail(p.email ?? '');
      setTitleAr(p.title_ar ?? '');
      setTitleEn(p.title_en ?? '');
      setAddressAr(p.address_ar ?? '');
      setAddressEn(p.address_en ?? '');
      setDob(p.date_of_birth ?? '');

      await refreshProfile();
      Alert.alert('تم الحفظ', 'تم إرسال التعديلات للمراجعة. بانتظار اعتماد الإدارة.');
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'تعذر حفظ البيانات.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('تأكيد', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: signOut },
    ]);
  };

  // Date picker change
  const onChangeDob = (_: any, picked?: Date) => {
    if (Platform.OS === 'android') setShowDobPicker(false); // Android picker is inline-modal
    if (picked) setDob(toYMD(picked));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff1e2' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 + kbHeight }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>الملف الشخصي</Text>

          {!!initial?.pending_approval && initial.pending_approval === 1 && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>قيد المراجعة من قِبل الإدارة</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>رقم الجوال</Text>
            <Text style={styles.value}>{user?.username || '—'}</Text>
          </View>

          <Field label="الاسم الكامل (عربي)">
            <TextInput style={styles.input} placeholder="اكتب اسمك الكامل بالعربية"
              value={fullname_ar} onChangeText={setFullnameAr} textAlign="right" returnKeyType="next" />
          </Field>

          <Field label="الاسم الكامل (إنجليزي)">
            <TextInput style={styles.input} placeholder="Full name (English)"
              value={fullname_en} onChangeText={setFullnameEn} textAlign="right" returnKeyType="next" />
          </Field>

          <Field label="البريد الإلكتروني">
            <TextInput style={styles.input} placeholder="email@example.com"
              value={email} onChangeText={setEmail} keyboardType="email-address"
              autoCapitalize="none" textAlign="right" returnKeyType="next" />
          </Field>

          <Field label="المسمى (عربي)">
            <TextInput style={styles.input} placeholder="مثال: طالب"
              value={title_ar} onChangeText={setTitleAr} textAlign="right" returnKeyType="next" />
          </Field>

          <Field label="المسمى (إنجليزي)">
            <TextInput style={styles.input} placeholder="e.g., Student"
              value={title_en} onChangeText={setTitleEn} textAlign="right" returnKeyType="next" />
          </Field>

          <Field label="العنوان (عربي)">
            <TextInput style={styles.input} placeholder="مثال: أبوظبي - الإمارات"
              value={address_ar} onChangeText={setAddressAr} textAlign="right" returnKeyType="next" />
          </Field>

          <Field label="العنوان (إنجليزي)">
            <TextInput style={styles.input} placeholder="Abu Dhabi, UAE"
              value={address_en} onChangeText={setAddressEn} textAlign="right" returnKeyType="next" />
          </Field>

          {/* Date field with native date picker */}
          <Field label="تاريخ الميلاد">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Keyboard.dismiss();
                setShowDobPicker(true);
              }}
            >
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={date_of_birth}
                editable={false}
                pointerEvents="none"
                textAlign="right"
              />
            </TouchableOpacity>
          </Field>

          {showDobPicker && (
            <DateTimePicker
              value={fromYMD(date_of_birth)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onChangeDob}
              maximumDate={new Date()} // لا مستقبل
            />
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, { opacity: changed && !saving ? 1 : 0.6 }]}
            onPress={handleSave}
            disabled={!changed || saving}
          >
            {saving ? <ActivityIndicator color="#eceadf" /> : <Text style={styles.primaryText}>حفظ</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 10 }]} onPress={handleLogout}>
            <Text style={styles.secondaryText}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={{ marginTop: 10 }}>
    <Text style={[styles.label, { marginBottom: 6 }]}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff1e2', padding: 16 },
  card: {
    backgroundColor: '#eceadf',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontFamily: 'NotoKufiArabic-Bold', fontSize: 18, color: '#111', marginBottom: 12 },
  banner: { backgroundColor: '#fff4e6', borderColor: '#d9480f', borderWidth: 1, padding: 8, borderRadius: 10, marginBottom: 8 },
  bannerText: { fontFamily: 'NotoKufiArabic-Bold', color: '#7a3e00', fontSize: 13, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' },
  label: { fontFamily: 'NotoKufiArabic-Bold', color: '#6b7280', fontSize: 13 },
  value: { fontFamily: 'NotoKufiArabic-Regular', color: '#111', fontSize: 14 },
  input: {
    backgroundColor: '#eceadf',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f4f30',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 14,
    color: '#111',
  },
  primaryBtn: {
    marginTop: 16, backgroundColor: '#0f4f30', paddingVertical: 12,
    borderRadius: 12, alignItems: 'center'
  },
  primaryText: { color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold', fontSize: 15 },
  secondaryBtn: {
    backgroundColor: 'transparent', paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#0f4f30', alignItems: 'center'
  },
  secondaryText: { color: '#0f4f30', fontFamily: 'NotoKufiArabic-Bold', fontSize: 15 },
});
