// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { api } from '../services/api';

type User = {
  id: number;
  username: string; // mobile
  email: string;
  status: number;
};

type Profile = {
  id?: number | null;
  fullname_ar?: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;

  // actions
  signUp: (mobile: string, password: string, email?: string) => Promise<void>;
  verifyOtp: (mobile: string, code: string) => Promise<void>;
  signIn: (mobile: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  // convenience
  displayName: string | null;
};

const AuthContext = createContext<AuthContextType>({} as any);
const TOKEN_KEY = 'authToken';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // boot: load token, then /me and /profile
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem(TOKEN_KEY);
        if (!t) return;

        setToken(t);
        const me = await api.me(t);
        setUser(me.user as User);

        try {
          const p = await api.getProfile(t);
          setProfile(p.profile ?? null);
        } catch {
          setProfile(null);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistToken = async (t: string | null) => {
    setToken(t);
    if (t) await AsyncStorage.setItem(TOKEN_KEY, t);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  };

  const signUp = async (mobile: string, password: string, email?: string) => {
    try {
      await api.signup(mobile, password, email);
      Alert.alert('تم', 'تم إرسال رمز التحقق إلى هاتفك.');
    } catch (e: any) {
      Alert.alert('خطأ', mapError(e.message));
      throw e;
    }
  };

  const fetchProfileSafe = async (t: string) => {
    try {
      const p = await api.getProfile(t);
      setProfile(p.profile ?? null);
    } catch {
      setProfile(null);
    }
  };

  const verifyOtp = async (mobile: string, code: string) => {
    try {
      const res = await api.verify(mobile, code);
      await persistToken(res.access_token);
      setUser(res.user as User);
      await fetchProfileSafe(res.access_token);
    } catch (e: any) {
      Alert.alert('خطأ', mapError(e.message));
      throw e;
    }
  };

  const signIn = async (mobile: string, password: string) => {
    try {
      const res = await api.login(mobile, password);
      await persistToken(res.access_token);
      setUser(res.user as User);
      await fetchProfileSafe(res.access_token);
    } catch (e: any) {
      Alert.alert('خطأ', mapError(e.message));
      throw e;
    }
  };

  const signOut = async () => {
    try {
      if (token) await api.logout(token);
    } catch {
      // ignore server error; still clear locally
    } finally {
      await persistToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  const refreshMe = async () => {
    if (!token) return;
    try {
      const me = await api.me(token);
      setUser(me.user as User);
    } catch {
      await persistToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    await fetchProfileSafe(token);
  };

  const displayName =
    (profile?.fullname_ar && profile.fullname_ar.trim() !== '' ? profile.fullname_ar : null) ??
    (user?.username ?? null);

  const value = useMemo(
    () => ({
      user,
      token,
      profile,
      loading,
      isAuthenticated: !!user && !!token,
      signUp,
      verifyOtp,
      signIn,
      signOut,
      refreshMe,
      refreshProfile,
      displayName,
    }),
    [user, token, profile, loading, displayName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// Error mapping from server codes → Arabic messages
function mapError(code: string) {
  switch (code) {
    case 'mobile_and_password_required': return 'الرجاء إدخال الجوال وكلمة المرور.';
    case 'mobile_already_registered': return 'رقم الجوال مسجّل مسبقًا.';
    case 'email_already_registered': return 'البريد الإلكتروني مسجّل مسبقًا.';
    case 'invalid_credentials': return 'بيانات الدخول غير صحيحة.';
    case 'not_verified': return 'الحساب غير مفعّل. الرجاء التحقق بالرمز.';
    case 'otp_incorrect': return 'رمز التحقق غير صحيح.';
    case 'otp_expired': return 'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.';
    case 'rate_limited': return 'يرجى الانتظار قليلًا قبل إعادة الإرسال.';
    case 'fullname_required': return 'الاسم الكامل مطلوب.';
    default: return 'حدث خطأ. حاول مجددًا.';
  }
}
