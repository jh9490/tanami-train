import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Alert, AppState} from 'react-native';

import {mapAuthError} from '../auth/otp';
import {api} from '../services/api';
import {
  onboardingApi,
  OnboardingApiError,
} from '../services/onboardingApi';
import {
  clearStoredProfileId,
  setStoredProfileId,
} from '../storage/authStorage';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../storage/accessTokenStorage';
import {
  clearBootstrapStorage,
  consumeBootstrapRefreshPending,
  loadBootstrapSnapshot,
  saveBootstrapSnapshot,
} from '../storage/bootstrapStorage';
import type {
  AuthenticatedLinkStatus,
  BootstrapProfile,
  HistoricalCertificateItem,
  OnboardingBootstrap,
  Profile,
  RegistrationRequestItem,
} from '../types/api';
import {
  reconcilePushInstallation,
  unlinkPushInstallation,
} from '../services/pushInstallation';

type User = {
  id: number;
  username: string;
  email: string;
  status: number;
};

type BootstrapCourses = OnboardingBootstrap['courses'];

type AuthContextType = {
  user: User | null;
  token: string | null;
  profile: Profile | null;
  bootstrap: OnboardingBootstrap | null;
  bootstrapLoading: boolean;
  bootstrapError: OnboardingApiError | null;
  bootstrapVersion: number | null;
  credentialInvalidationVersion: number;
  bootstrapProfile: BootstrapProfile | null;
  linkStatus: AuthenticatedLinkStatus | null;
  courses: BootstrapCourses;
  certificates: HistoricalCertificateItem[];
  registrationRequests: RegistrationRequestItem[];
  historyLinkRequest: OnboardingBootstrap['history_link_request'];
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (
    countryCode: string,
    mobileNumber: string,
    password: string,
    email?: string,
  ) => Promise<void>;
  verifyOtp: (mobile: string, code: string) => Promise<void>;
  signIn: (mobile: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  installAccessToken: (accessToken: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshBootstrap: () => Promise<OnboardingBootstrap | null>;
  refreshAccountData: () => Promise<void>;
  displayName: string | null;
};

const EMPTY_COURSES: BootstrapCourses = {
  upcoming: [],
  current: [],
  previous: [],
};
const EMPTY_CERTIFICATES: HistoricalCertificateItem[] = [];
const EMPTY_REGISTRATIONS: RegistrationRequestItem[] = [];

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function isUnauthorized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 401
  );
}

function bootstrapProfileToProfile(
  source: BootstrapProfile | null,
  previous: Profile | null,
): Profile | null {
  if (!source) return null;

  const supplemental = previous?.id === source.id ? previous : null;
  return {
    id: source.id,
    student_id: source.student_id,
    mobile: source.mobile,
    fullname_ar: source.fullname_ar,
    fullname_en: source.fullname_en,
    email: source.email,
    date_of_birth: source.date_of_birth,
    title_ar: supplemental?.title_ar ?? null,
    title_en: supplemental?.title_en ?? null,
    address_ar: supplemental?.address_ar ?? null,
    address_en: supplemental?.address_en ?? null,
    pending_approval: supplemental?.pending_approval,
    last_submitted_at: supplemental?.last_submitted_at,
    approved_at: supplemental?.approved_at,
  };
}

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bootstrap, setBootstrap] = useState<OnboardingBootstrap | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapError, setBootstrapError] =
    useState<OnboardingApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [credentialInvalidationVersion, setCredentialInvalidationVersion] =
    useState(0);

  const tokenRef = useRef<string | null>(null);
  const bootstrapRequestRef = useRef(0);
  const bootstrapCommitRef = useRef<Promise<void>>(Promise.resolve());

  const updateToken = useCallback((nextToken: string | null) => {
    tokenRef.current = nextToken;
    setToken(nextToken);
  }, []);

  const writeProfileIdToStorage = useCallback(
    async (nextProfile?: {id: number} | null) => {
      if (nextProfile?.id != null) {
        await setStoredProfileId(nextProfile.id);
      } else {
        await clearStoredProfileId();
      }
    },
    [],
  );

  const clearSession = useCallback(async (credentialInvalidated = false) => {
    bootstrapRequestRef.current += 1;
    updateToken(null);
    setUser(null);
    setProfile(null);
    setBootstrap(null);
    setBootstrapError(null);
    setBootstrapLoading(false);
    if (credentialInvalidated) {
      setCredentialInvalidationVersion(current => current + 1);
    }

    await Promise.allSettled([
      clearAccessToken(),
      clearStoredProfileId(),
      clearBootstrapStorage(),
    ]);
  }, [updateToken]);

  const applyBootstrap = useCallback(
    async (snapshot: OnboardingBootstrap) => {
      setBootstrap(snapshot);
      setProfile(previous =>
        bootstrapProfileToProfile(snapshot.profile, previous),
      );
      await writeProfileIdToStorage(snapshot.profile);
    },
    [writeProfileIdToStorage],
  );

  const refreshBootstrapForToken = useCallback(
    async (accessToken: string): Promise<OnboardingBootstrap | null> => {
      const requestId = ++bootstrapRequestRef.current;
      setBootstrapLoading(true);
      setBootstrapError(null);

      try {
        const snapshot = await onboardingApi.bootstrap(accessToken);

        if (
          requestId !== bootstrapRequestRef.current ||
          tokenRef.current !== accessToken
        ) {
          return null;
        }

        let committed = false;
        const commit = bootstrapCommitRef.current
          .catch(() => undefined)
          .then(async () => {
            if (
              requestId !== bootstrapRequestRef.current ||
              tokenRef.current !== accessToken
            ) {
              return;
            }

            await saveBootstrapSnapshot(snapshot);

            if (
              requestId !== bootstrapRequestRef.current ||
              tokenRef.current !== accessToken
            ) {
              return;
            }

            await applyBootstrap(snapshot);
            committed = true;
          });
        bootstrapCommitRef.current = commit;
        await commit;
        return committed ? snapshot : null;
      } catch (error) {
        if (requestId !== bootstrapRequestRef.current) return null;

        if (isUnauthorized(error)) {
          await clearSession(true);
        } else if (error instanceof OnboardingApiError) {
          setBootstrapError(error);
        }
        throw error;
      } finally {
        if (requestId === bootstrapRequestRef.current) {
          setBootstrapLoading(false);
        }
      }
    },
    [applyBootstrap, clearSession],
  );

  const prepareAuthenticatedSession = useCallback(
    async (accessToken: string, nextUser: User | null) => {
      await setAccessToken(accessToken);

      bootstrapRequestRef.current += 1;
      setBootstrap(null);
      setBootstrapError(null);
      setProfile(null);
      setUser(nextUser);
      updateToken(accessToken);
      await Promise.allSettled([
        clearBootstrapStorage(),
        clearStoredProfileId(),
      ]);

      try {
        await refreshBootstrapForToken(accessToken);
      } catch (error) {
        // The credential is already installed. Preserve the authenticated
        // session across retryable Bootstrap failures, but propagate a 401
        // after the centralized clearing path has invalidated it.
        if (isUnauthorized(error)) throw error;
      }

      // Authentication, not a caller-supplied profile ID, is authoritative.
      // Never fall back to a guest registration when Bootstrap is unavailable.
      await reconcilePushInstallation(accessToken).catch(error => {
        console.log('Authenticated push reconciliation failed:', error);
      });
    },
    [refreshBootstrapForToken, updateToken],
  );

  const installAccessToken = useCallback(
    async (accessToken: string) => {
      await prepareAuthenticatedSession(accessToken, null);
    },
    [prepareAuthenticatedSession],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let storedToken: string | null = null;
      try {
        storedToken = await getAccessToken();
        if (cancelled) return;

        if (!storedToken) {
          await clearBootstrapStorage();
          return;
        }

        updateToken(storedToken);
        const cached = await loadBootstrapSnapshot();
        if (cancelled) return;
        if (cached) await applyBootstrap(cached);
        if (cancelled) return;

        await consumeBootstrapRefreshPending();
        if (cancelled) return;

        await refreshBootstrapForToken(storedToken);
      } catch (error) {
        if (isUnauthorized(error) && tokenRef.current) {
          await clearSession(true);
        }
      } finally {
        if (!cancelled && tokenRef.current === storedToken) {
          await reconcilePushInstallation(storedToken).catch(error => {
            console.log('Restored push reconciliation failed:', error);
          });
        }
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      bootstrapRequestRef.current += 1;
    };
  }, [
    applyBootstrap,
    clearSession,
    refreshBootstrapForToken,
    updateToken,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const currentToken = tokenRef.current;
      if (nextState === 'active' && currentToken) {
        consumeBootstrapRefreshPending()
          .catch(() => false)
          .then(() => refreshBootstrapForToken(currentToken))
          .catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [refreshBootstrapForToken]);

  const signUp = async (
    countryCode: string,
    mobileNumber: string,
    password: string,
    email?: string,
  ) => {
    try {
      await api.signup(countryCode, mobileNumber, password, email);
      Alert.alert('تم', 'تم إنشاء الحساب بنجاح. أكمل التحقق لاستلام الرمز.');
    } catch (error: any) {
      Alert.alert('خطأ', mapAuthError(error.message));
      throw error;
    }
  };

  const verifyOtp = async (mobile: string, code: string) => {
    try {
      const response = await api.verify(mobile, code);
      await prepareAuthenticatedSession(
        response.access_token,
        response.user as User,
      );
    } catch (error: any) {
      Alert.alert('خطأ', mapAuthError(error.message));
      throw error;
    }
  };

  const signIn = async (mobile: string, password: string) => {
    try {
      const response = await api.login(mobile, password);
      await prepareAuthenticatedSession(
        response.access_token,
        response.user as User,
      );
    } catch (error: any) {
      Alert.alert('خطأ', mapAuthError(error.message));
      throw error;
    }
  };

  const signOut = useCallback(async () => {
    const currentToken = tokenRef.current;
    try {
      if (currentToken) {
        try {
          await unlinkPushInstallation(currentToken);
        } catch (error) {
          console.log('Push unlink deferred:', error);
        }
        await api.logout(currentToken);
      }
    } catch {
      // Server logout is best-effort; local credentials are always cleared.
    } finally {
      await clearSession();
      await reconcilePushInstallation(null).catch(error => {
        console.log('Guest push reconciliation failed:', error);
      });
    }
  }, [clearSession]);

  const refreshMe = async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;

    try {
      const response = await api.me(currentToken);
      setUser(response.user as User);
    } catch (error) {
      if (isUnauthorized(error)) await clearSession(true);
      else throw error;
    }
  };

  const refreshProfile = async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;

    try {
      const response = await api.getProfile(currentToken);
      const detailedProfile = response.profile ?? null;
      const authoritativeProfile = bootstrap?.profile ?? null;
      const nextProfile = authoritativeProfile
        ? bootstrapProfileToProfile(authoritativeProfile, detailedProfile)
        : detailedProfile;
      setProfile(nextProfile);
      await writeProfileIdToStorage(nextProfile);
    } catch (error) {
      if (isUnauthorized(error)) await clearSession(true);
      else throw error;
    }
  };

  const refreshBootstrap = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return null;
    const snapshot = await refreshBootstrapForToken(currentToken);
    await reconcilePushInstallation(currentToken).catch(error => {
      console.log('Profile push reconciliation failed:', error);
    });
    return snapshot;
  }, [refreshBootstrapForToken]);

  const refreshAccountData = useCallback(async () => {
    await refreshBootstrap();
  }, [refreshBootstrap]);

  const hasLinkedHistory = bootstrap?.link_status === 'linked';
  const courses = hasLinkedHistory ? bootstrap.courses : EMPTY_COURSES;
  const certificates = hasLinkedHistory
    ? bootstrap.certificates
    : EMPTY_CERTIFICATES;
  const registrationRequests = hasLinkedHistory
    ? bootstrap.registration_requests
    : EMPTY_REGISTRATIONS;
  const displayName =
    (bootstrap?.profile?.fullname_ar?.trim() || null) ??
    (bootstrap?.profile?.fullname_en?.trim() || null) ??
    (profile?.fullname_ar?.trim() || null) ??
    (profile?.fullname_en?.trim() || null) ??
    (user?.username ?? null);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      profile,
      bootstrap,
      bootstrapLoading,
      bootstrapError,
      bootstrapVersion: bootstrap?.cache.version ?? null,
      credentialInvalidationVersion,
      bootstrapProfile: bootstrap?.profile ?? null,
      linkStatus: bootstrap?.link_status ?? null,
      courses,
      certificates,
      registrationRequests,
      historyLinkRequest: bootstrap?.history_link_request ?? null,
      loading,
      isAuthenticated: Boolean(token),
      signUp,
      verifyOtp,
      signIn,
      signOut,
      installAccessToken,
      refreshMe,
      refreshProfile,
      refreshBootstrap,
      refreshAccountData,
      displayName,
    }),
    // Legacy actions intentionally close over the current provider state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      user,
      token,
      profile,
      bootstrap,
      bootstrapLoading,
      bootstrapError,
      credentialInvalidationVersion,
      courses,
      certificates,
      registrationRequests,
      loading,
      signOut,
      installAccessToken,
      refreshBootstrap,
      refreshAccountData,
      displayName,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
