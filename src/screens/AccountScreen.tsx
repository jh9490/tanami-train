// src/screens/AccountScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function AccountScreen() {
  const { user, token, signOut, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState<string>('');
  const [initial, setInitial] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!token) return;
        const res = await api.getProfile(token);
        if (!mounted) return;
        const name = res.profile?.fullname_ar ?? '';
        setFullName(name);
        setInitial(name);
      } catch {
        // if no profile yet, we’ll show empty input
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const name = (fullName || '').trim();
      if (!name) {
        Alert.alert('تنبيه', 'الاسم الكامل مطلوب.');
        return;
      }
      await api.updateProfile(token, { fullname_ar: name });
  
      // 🔄 pull latest profile into context so Home sees it
      await refreshProfile();
  
      setInitial(name);
      Alert.alert('تم الحفظ', 'تم تحديث بيانات الملف الشخصي.');
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'تعذر حفظ البيانات.');
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

  const changed = fullName !== initial;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>الملف الشخصي</Text>

        {/* Mobile number (username) */}
        <View style={styles.row}>
          <Text style={styles.label}>رقم الجوال</Text>
          <Text style={styles.value}>{user?.username || '—'}</Text>
        </View>

        {/* Editable full name */}
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.label, { marginBottom: 6 }]}>الاسم الكامل</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <TextInput
              placeholder="اكتب اسمك الكامل"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              textAlign="right"
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { opacity: changed && !saving ? 1 : 0.6 }]}
          onPress={handleSave}
          disabled={!changed || saving}
        >
          {saving ? (
            <ActivityIndicator color="#eceadf" />
          ) : (
            <Text style={styles.primaryText}>حفظ</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 10 }]} onPress={handleLogout}>
          <Text style={styles.secondaryText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { fontFamily: 'NotoKufiArabic-Bold', color: '#6b7280', fontSize: 13, marginLeft: 8 },
  value: { fontFamily: 'NotoKufiArabic-Regular', color: '#111', fontSize: 14 },
  input: {
    backgroundColor: '#eceadf',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: 'NotoKufiArabic-Regular',
    fontSize: 14,
    color: '#111',
  },
  primaryBtn: { marginTop: 16, backgroundColor: '#0f4f30', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#eceadf', fontFamily: 'NotoKufiArabic-Bold', fontSize: 15 },
  secondaryBtn: { backgroundColor: 'transparent', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#0f4f30', alignItems: 'center' },
  secondaryText: { color: '#0f4f30', fontFamily: 'NotoKufiArabic-Bold', fontSize: 15 },
});
