// src/services/api.ts

/** Base URLs */
export const BASE_ROOT = 'https://admin.tanamitrain.com';
export const MOBILE_API_URL = `${BASE_ROOT}/api/mobile-app`;
const BASE_URL = MOBILE_API_URL;                  // mobile-app endpoints

type HttpMethod = 'GET' | 'POST' | 'PATCH';

import {
  CoursesResponse,
  CertificatesResponse,
  GetCourseResponse,
  Phase,
  Profile,
  PushInstallationResponse,
  RegisterPushInstallationBody,
  RegisterRequestResponse,
  RegistrationRequestItem,
  UpdateProfileBody,
} from '../types/api';
import { OtpDeliveryMethod } from '../auth/otp';
import {buildSeparatedPhone} from '../util/phone';

/* ----------------------------- Debug helpers ----------------------------- */

const DEBUG = true; // flip to false in prod

const SECRET_LOG_KEYS = new Set([
  'authorization',
  'access_token',
  'session_token',
  'password',
  'current_password',
  'new_password',
  'code',
  'otp',
  'token',
]);

function redactForLog(value: any): any {
  if (Array.isArray(value)) return value.map(redactForLog);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SECRET_LOG_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redactForLog(entry),
    ]),
  );
}

function logReq(path: string, method: string, body?: any, token?: string) {
  if (!DEBUG) return;
  const hasToken = Boolean(token);
  console.log(
    `%c[API →] ${method} ${path}`,
    'color:#0b7285;font-weight:bold',
    '\nbody:', redactForLog(body ?? {}),
    hasToken ? '\n(Authorization: Bearer ...)' : ''
  );
}

function logRes(path: string, status: number, json: any) {
  if (!DEBUG) return;
  const ok = status >= 200 && status < 300;
  console[ok ? 'log' : 'warn'](
    `%c[API ←] ${status} ${path}`,
    ok ? 'color:#2b8a3e;font-weight:bold' : 'color:#d9480f;font-weight:bold',
    '\njson:', redactForLog(json)
  );
}

function logErr(path: string, e: any) {
  if (!DEBUG) return;
  console.error(`%c[API ✖] ${path}`, 'color:#c92a2a;font-weight:bold', '\nerror:', e?.message || e);
}

/* ------------------------------ Core request ----------------------------- */

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message?: string,
  ) {
    super(message || code);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: any,
  token?: string
): Promise<T> {
  const url = `${BASE_URL}/${path}`;
  try {
    logReq(path, method, body, token);
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    });

    const text = await res.text();                // read once
    let json: any;
    try { json = text ? JSON.parse(text) : {}; }  // parse if possible
    catch { json = { ok: false, raw: text }; }

    logRes(path, res.status, json);

    if (!res.ok || (json && json.ok === false)) {
      const code = json?.error ?? json?.message ?? `HTTP_${res.status}`;
      throw new ApiError(code, res.status, json?.message ?? code);
    }
    return json as T;
  } catch (e: any) {
    logErr(path, e);
    throw e;
  }
}

/* ----------------------- small JSON fetch utilities ---------------------- */

async function debugJson(url: string, headers: Record<string, string>) {
  console.log('➡️ GET', url);
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  console.log('⬅️', res.status, res.statusText || '', '| body preview:', text.slice(0, 180));
  try { return JSON.parse(text); }
  catch { throw new Error(`HTTP ${res.status} ${res.statusText || ''} (not JSON)`); }
}

async function jsonFetch(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...opts,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { ok: false, status: res.status, raw: text }; }
}

async function jsonFetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  try {
    console.log('[API] →', opts.method || 'GET', url);
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      ...opts,
    });
    const text = await res.text();
    console.log('[API] ←', res.status, text.slice(0, 400));
    try { return JSON.parse(text); } catch { return { ok: false, status: res.status, raw: text }; }
  } catch (e: any) {
    console.log('[API] ✖', e?.name || e, e?.message);
    return { ok: false, error: e?.message || 'network_error' };
  } finally {
    clearTimeout(to);
  }
}

async function pushJson<T>(
  path: 'register' | 'unlink',
  body: unknown,
  accessToken?: string | null,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE_ROOT}/api/fcm/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = {ok: false, raw: text};
    }
    if (!res.ok || json?.ok === false) {
      throw new ApiError(
        json?.error ?? `HTTP_${res.status}`,
        res.status,
        json?.message ?? `push ${path} http ${res.status}`,
      );
    }
    return json as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError('push_timeout', 0, `push ${path} timed out`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/* -------------------------------- Endpoints ------------------------------ */

function buildOtpBody(
  mobile: string,
  reason: 'initial' | 'resend' | 'password_reset',
  deliveryMethod: OtpDeliveryMethod,
) {
  return {
    mobile,
    reason,
    delivery_method: deliveryMethod,
  };
}

export const api = {
  // Auth
  signup: (
    countryCode: string,
    mobileNumber: string,
    password: string,
    email?: string,
  ) =>
    request<{ ok: true; message: string; mobile: string }>(
      'signup',
      'POST',
      {...buildSeparatedPhone(countryCode, mobileNumber), password, email},
    ),

  verify: (mobile: string, code: string) =>
    request<{ ok: true; message: string; access_token: string; user: any }>(
      'verify', 'POST', { mobile, code }
    ),

  login: (mobile: string, password: string) =>
    request<{ ok: true; access_token: string; user: any }>(
      'login', 'POST', { mobile, password }
    ),

  me: (token: string) =>
    request<{ ok: true; user: any }>('me', 'GET', undefined, token),

  logout: (token: string) =>
    request<{ ok: true; message: string }>('logout', 'POST', {}, token),

  // Profile
  getProfile: (token: string) =>
    request<{ ok: true; profile: Profile | null }>('profile', 'GET', undefined, token),

  updateProfile: (token: string, data: UpdateProfileBody) =>
    request<{ ok: true; profile: Profile }>('profile', 'PATCH', data, token),

  // Password
  passwordResetRequest: (
    mobile: string,
    deliveryMethod: OtpDeliveryMethod = 'whatsapp',
  ) =>
    request<{ ok: boolean; message: string }>(
      'password-reset-request',
      'POST',
      { mobile, delivery_method: deliveryMethod },
    ),

  passwordResetVerify: (mobile: string, code: string, password: string) =>
    request<{ ok: true; message: string; access_token: string }>(
      'password-reset-verify', 'POST', { mobile, code, password }
    ),

  changePassword: (token: string, current_password: string, new_password: string) =>
    request<{ ok: true; message: string; access_token: string }>(
      'change-password', 'POST', { current_password, new_password }, token
    ),

  // Courses
  fetchCourses: (token: string, phase: Phase = 'all', mobile?: string | null) =>
    request<CoursesResponse>(
      'my-courses',
      'POST',
      mobile ? { mobile, phase } : { phase },
      token,
    ),

  fetchCertificates: (token: string) =>
    request<CertificatesResponse>('my-certificates', 'GET', undefined, token),

  async fetchCourseById(token: string | null | undefined, id: string | number) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `${BASE_URL}/get-course?id=${id}`;
    return debugJson(url, headers) as Promise<GetCourseResponse>;
  },

  async fetchActivityFiles(token: string | null | undefined, activityId: string | number) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `${BASE_URL}/activity-files?id=${activityId}`;
    return debugJson(url, headers);
  },

  async fetchCertificateByStudentActivity(
    token: string | null | undefined,
    activityId: string | number | null | undefined,
    studentId: string | number,
    courseId?: string | number | null,
  ) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const courseQuery = courseId == null ? '' : `&course_id=${encodeURIComponent(String(courseId))}`;
    const activityQuery = activityId == null ? '' : encodeURIComponent(String(activityId));
    const url = `${BASE_URL}/certi-by-student-activity?student_id=${encodeURIComponent(String(studentId))}&activity_id=${activityQuery}${courseQuery}`;
    return debugJson(url, headers);
  },

  // OTP via the shared mobile-app endpoint. New UI sends WhatsApp, while backend
  // can still accept legacy Telegram/SMS methods for older app versions.
  sendOtp: (
    mobile: string,
    reason: 'initial' | 'resend' | 'password_reset' = 'initial',
    deliveryMethod: OtpDeliveryMethod = 'whatsapp',
  ) =>
    request<{ ok: boolean; message?: string; delivery_method?: OtpDeliveryMethod }>(
      'send-otp',
      'POST',
      buildOtpBody(mobile, reason, deliveryMethod),
    ),

  resendOtp: (mobile: string, deliveryMethod: OtpDeliveryMethod = 'whatsapp') =>
    request<{ ok: boolean; message?: string; delivery_method?: OtpDeliveryMethod }>(
      'send-otp',
      'POST',
      buildOtpBody(mobile, 'resend', deliveryMethod),
    ),

  // FCM / Inbox (server paths live under BASE_ROOT)
  async registerPushInstallation(
    body: RegisterPushInstallationBody,
    accessToken?: string | null,
  ): Promise<PushInstallationResponse> {
    return pushJson<PushInstallationResponse>('register', body, accessToken);
  },

  async unlinkPushInstallation(
    installationId: string,
    accessToken: string,
  ): Promise<PushInstallationResponse> {
    return pushJson<PushInstallationResponse>(
      'unlink',
      {installation_id: installationId},
      accessToken,
    );
  },

  async inboxAck(body: {
    profile_id: number | null;
    device_id: string;
    notification_id?: number;
    fcm_message_id?: string;
    title?: string;
    body?: string;
    data?: Record<string, string>;
    via?: 'token' | 'profile' | 'topic';
    received_at?: string; // 'YYYY-MM-DD HH:mm:ss'
  }) {
    return jsonFetch(`${BASE_ROOT}/api/fcm/inbox-ack`, { method: 'POST', body: JSON.stringify(body) });
  },

  async inboxList(profileId: number, limit = 20, offset = 0) {
    const url = `${BASE_ROOT}/api/fcm/inbox-list?profile_id=${profileId}&limit=${limit}&offset=${offset}`;
    return jsonFetchWithTimeout(url);
  },

  async inboxOpen(profileId: number, inboxId: number) {
    return jsonFetchWithTimeout(`${BASE_ROOT}/api/fcm/inbox-open`, {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId, inbox_id: inboxId }),
    });
  },

  // Registrations
  getActivity: (activityId: number, token?: string) =>
    request<Record<string, any>>(
      `get-activity?activity_id=${encodeURIComponent(String(activityId))}`,
      'GET',
      undefined,
      token,
    ),

  registerForActivity: (
    token: string,
    activity_id: number,
    online: 0 | 1 = 0,
    certificate_requested?: boolean,
  ) =>
    request<RegisterRequestResponse>(
      'register-request',
      'POST',
      {
        activity_id,
        online,
        ...(certificate_requested === undefined ? {} : { certificate_requested }),
      },
      token,
    ),

  myRegistrations: (token: string) =>
    request<{ ok: true; items: RegistrationRequestItem[] }>('my-registrations', 'GET', undefined, token),

  // App Update
  checkForUpdate: async (): Promise<{
    current_version: string;
    url?: string;
    download_url?: string;
    store_url?: string;
    play_store_url?: string;
  }> => {
    const res = await fetch(`${MOBILE_API_URL}/check-for-update`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`checkForUpdate http ${res.status}`);
    }
    return res.json();
  },

  refreshAccountData: (token: string) =>
    Promise.all([
      api.getProfile(token),
      api.fetchCourses(token, 'all'),
      api.fetchCertificates(token),
      api.myRegistrations(token),
    ]),
};
