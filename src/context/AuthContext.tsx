// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { api } from '../services/api';
import { mapAuthError, OtpDeliveryMethod } from '../auth/otp';
import { getOrCreateDeviceId } from '../util/deviceId';

// ⬇️ NEW: import your storage helpers for profile id
import {
  getStoredProfileId,
  setStoredProfileId,
  clearStoredProfileId,
} from '../storage/authStorage';

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
  signUp: (
    mobile: string,
    password: string,
    email?: string,
    deliveryMethod?: OtpDeliveryMethod,
  ) => Promise<void>;
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

  /** Register this device/token with backend for a specific profile (or null) */
  const registerFcmForProfile = async (profileId: number | null) => {
    try {
      await messaging().registerDeviceForRemoteMessages();
      const fcm = await messaging().getToken();
      const deviceId = await getOrCreateDeviceId();
      await api.registerPushToken({
        profile_id: profileId, // null if guest
        device_id: deviceId,
        platform: 'android',
        token: fcm,
        app_version: '1.0.1',
      });
    } catch (e) {
      console.log('❌ FCM register error:', e);
    }
  };

  // ---- helpers to keep storage in sync ----
  const persistToken = async (t: string | null) => {
    setToken(t);
    if (t) await AsyncStorage.setItem(TOKEN_KEY, t);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  };

  const writeProfileIdToStorage = async (p?: Profile | null) => {
    const pid = p?.id ?? null;
    if (pid != null) {
      await setStoredProfileId(pid);
    } else {
      await clearStoredProfileId();
    }
  };

  /** fetch profile and also return it, while syncing storage */
  const fetchProfileSafe = async (t: string): Promise<Profile | null> => {
    try {
      const p = await api.getProfile(t);
      const prof = p.profile ?? null;
      setProfile(prof);
      await writeProfileIdToStorage(prof); // ⬅️ keep storage in sync
      return prof;
    } catch {
      setProfile(null);
      await clearStoredProfileId(); // ⬅️ remove stale id if any
      return null;
    }
  };

  // boot: load token, then /me and /profile, then register FCM if logged in
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem(TOKEN_KEY);
        if (!t) return;

        setToken(t);
        const me = await api.me(t);
        setUser(me.user as User);

        let prof: Profile | null = null;
        try {
          const p = await api.getProfile(t);
          prof = p.profile ?? null;
          setProfile(prof);
          await writeProfileIdToStorage(prof); // ⬅️ store profile id on boot
        } catch {
          setProfile(null);
          await clearStoredProfileId();
        }

        const profileId = prof?.id ?? null;
        if (profileId) await registerFcmForProfile(profileId);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signUp = async (
    mobile: string,
    password: string,
    email?: string,
    deliveryMethod: OtpDeliveryMethod = 'telegram',
  ) => {
    try {
      await api.signup(mobile, password, email, deliveryMethod);
      Alert.alert('تم', 'تم إنشاء الحساب بنجاح. أكمل التحقق لاستلام الرمز.');
    } catch (e: any) {
      Alert.alert('خطأ', mapAuthError(e.message));
      throw e;
    }
  };

  const verifyOtp = async (mobile: string, code: string) => {
    try {
      const res = await api.verify(mobile, code);
      await persistToken(res.access_token);
      setUser(res.user as User);

      const prof = await fetchProfileSafe(res.access_token); // ⬅️ writes storage inside
      const profileId = prof?.id ?? null;

      // register after verification (user is now logged in)
      await registerFcmForProfile(profileId ?? null);
    } catch (e: any) {
      Alert.alert('خطأ', mapAuthError(e.message));
      throw e;
    }
  };

  const signIn = async (mobile: string, password: string) => {
    try {
      const res = await api.login(mobile, password);
      await persistToken(res.access_token);
      setUser(res.user as User);

      const prof = await fetchProfileSafe(res.access_token); // ⬅️ writes storage inside
      const profileId = prof?.id ?? null;

      // register after login
      await registerFcmForProfile(profileId ?? null);
    } catch (e: any) {
      Alert.alert('خطأ', mapAuthError(e.message));
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
      await clearStoredProfileId(); // ⬅️ remove profile id for ACK readers
      // optional: keep guest registration handled in App.tsx
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
      await clearStoredProfileId();
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    await fetchProfileSafe(token); // ⬅️ keeps storage aligned as well
  };

  // re-register when FCM token refreshes (if logged in)
  useEffect(() => {
    const unsub = messaging().onTokenRefresh(async (newToken) => {
      try {
        const deviceId = await getOrCreateDeviceId();
        const profileId = profile?.id ?? null;
        await api.registerPushToken({
          profile_id: profileId ?? null,
          device_id: deviceId,
          platform: 'android',
          token: newToken,
          app_version: '1.0.1',
        });
      } catch (e) {
        console.log('onTokenRefresh register error:', e);
      }
    });
    return () => unsub();
  }, [user?.id, profile?.id]);

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
