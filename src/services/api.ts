// src/services/api.ts

/** Base URLs */
export const BASE_ROOT = 'https://tanamitrain.com/tanamiAdmin';
const BASE_URL  = `${BASE_ROOT}/api/mobile-app`;   // mobile-app endpoints
const BASE_TG   = `${BASE_ROOT}/api/telegram`;     // telegram endpoints
const BASE      = BASE_ROOT;                       // legacy helpers expect BASE

type HttpMethod = 'GET' | 'POST' | 'PATCH';

import {
  CoursesResponse,
  GetCourseResponse,
  Phase,
  Profile,
  RegisterPushBody,
  RegisterRequestResponse,
  UpdateProfileBody,
} from '../types/api';
import { OtpDeliveryMethod, OTP_PROXY_TOPIC } from '../auth/otp';

/* ----------------------------- Debug helpers ----------------------------- */

const DEBUG = true; // flip to false in prod

function logReq(path: string, method: string, body?: any, token?: string) {
  if (!DEBUG) return;
  const hasToken = Boolean(token);
  console.log(
    `%c[API →] ${method} ${path}`,
    'color:#0b7285;font-weight:bold',
    '\nbody:', body ?? {},
    hasToken ? '\n(Authorization: Bearer ...)' : ''
  );
}

function logRes(path: string, status: number, json: any) {
  if (!DEBUG) return;
  const ok = status >= 200 && status < 300;
  console[ok ? 'log' : 'warn'](
    `%c[API ←] ${status} ${path}`,
    ok ? 'color:#2b8a3e;font-weight:bold' : 'color:#d9480f;font-weight:bold',
    '\njson:', json
  );
}

function logErr(path: string, e: any) {
  if (!DEBUG) return;
  console.error(`%c[API ✖] ${path}`, 'color:#c92a2a;font-weight:bold', '\nerror:', e?.message || e);
}

/* ------------------------------ Core request ----------------------------- */

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
      throw new Error(json?.error ?? json?.message ?? `HTTP_${res.status}`);
    }
    return json as T;
  } catch (e: any) {
    logErr(path, e);
    throw e;
  }
}

/** Absolute-path request (for /api/telegram/* etc.) */
async function requestAbs<T>(
  url: string,
  method: HttpMethod = 'GET',
  body?: any,
  token?: string
): Promise<T> {
  const label = url.replace(BASE_ROOT, '');
  try {
    logReq(label, method, body, token);
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    });
    const text = await res.text();
    let json: any; try { json = text ? JSON.parse(text) : {}; } catch { json = { ok: false, raw: text }; }
    logRes(label, res.status, json);
    if (!res.ok || (json && json.ok === false)) throw new Error(json?.error ?? json?.message ?? `HTTP_${res.status}`);
    return json as T;
  } catch (e: any) {
    logErr(label, e);
    throw e;
  }
}

/* ----------------------- small JSON fetch utilities ---------------------- */

async function debugJson(url: string, headers: Record<string,string>) {
  console.log('➡️ GET', url);
  const res   = await fetch(url, { method: 'GET', headers });
  const text  = await res.text();
  console.log('⬅️', res.status, res.statusText || '', '| body preview:', text.slice(0, 180));
  try { return JSON.parse(text); }
  catch { throw new Error(`HTTP ${res.status} ${res.statusText || ''} (not JSON)`); }
}

async function jsonFetch(url: string, opts: RequestInit = {}) {
  const res  = await fetch(url, {
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
    const res  = await fetch(url, {
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
    ...(deliveryMethod === 'sms' ? { proxy_topic: OTP_PROXY_TOPIC } : {}),
  };
}

export const api = {
  // Auth
  signup: (
    mobile: string,
    password: string,
    email?: string,
    deliveryMethod: OtpDeliveryMethod = 'telegram',
  ) =>
    request<{ ok: true; message: string; mobile: string }>(
      'signup',
      'POST',
      { mobile, password, email, otp_delivery_method: deliveryMethod },
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
  passwordResetRequest: (mobile: string) =>
    request<{ ok: boolean; message: string }>('password-reset-request', 'POST', { mobile }),

  passwordResetVerify: (mobile: string, code: string, password: string) =>
    request<{ ok: true; message: string; access_token: string }>(
      'password-reset-verify', 'POST', { mobile, code, password }
    ),

  changePassword: (token: string, current_password: string, new_password: string) =>
    request<{ ok: true; message: string; access_token: string }>(
      'change-password', 'POST', { current_password, new_password }, token
    ),

  // Courses
  fetchCourses: (token: string, mobile: string, phase: Phase = 'all') =>
    request<CoursesResponse>('my-courses', 'POST', { mobile, phase }, token),

  async fetchCourseById(token: string | null | undefined, id: string | number) {
    const headers: Record<string,string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `${BASE_URL}/get-course?id=${id}`;
    return debugJson(url, headers) as Promise<GetCourseResponse>;
  },

  async fetchActivityFiles(token: string | null | undefined, activityId: string | number) {
    const headers: Record<string,string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `${BASE_URL}/activity-files?id=${activityId}`;
    return debugJson(url, headers);
  },

  async fetchCertificateByStudentActivity(token: string | null | undefined, activityId: string | number, studentId: string | number) {
    const headers: Record<string,string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `${BASE_URL}/certi-by-student-activity?activity_id=${activityId}&student_id=${studentId}`;
    return debugJson(url, headers);
  },

  // Telegram helpers — these hit /api/telegram/*
  telegramStatus: (mobile: string) =>
    requestAbs<{ ok: true; linked: boolean }>(`${BASE_TG}/status`, 'POST', { mobile }),

  telegramCreateLink: (mobile: string) =>
    requestAbs<{ ok: true; payload: string; code?: string; ttl_minutes?: number }>(
      `${BASE_TG}/create-link-payload`, 'POST', { mobile }
    ),

  // OTP via Telegram — this one stays under mobile-app (unless you moved it)
  sendOtp: (
    mobile: string,
    reason: 'initial' | 'resend' | 'password_reset' = 'initial',
    deliveryMethod: OtpDeliveryMethod = 'telegram',
  ) =>
    request<{ ok: boolean; message?: string }>(
      'send-otp',
      'POST',
      buildOtpBody(mobile, reason, deliveryMethod),
    ),

  resendOtp: (mobile: string, deliveryMethod: OtpDeliveryMethod = 'telegram') =>
    request<{ ok: boolean; message?: string }>(
      'send-otp',
      'POST',
      buildOtpBody(mobile, 'resend', deliveryMethod),
    ),

  // FCM / Inbox (legacy server paths live under BASE_ROOT)
  async registerPushToken(body: RegisterPushBody) {
    const res = await fetch(`${BASE_ROOT}/api/fcm/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: any; try { json = JSON.parse(text); } catch { json = { ok: false, raw: text }; }
    if (!res.ok || json?.ok === false) throw new Error(`registerPushToken http ${res.status}`);
    return json;
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
  registerForActivity: (token: string, activity_id: number, online: 0|1 = 0) =>
    request<RegisterRequestResponse>('register-request', 'POST', { activity_id, online }, token),

  myRegistrations: (token: string) =>
    request<{ ok: true; items: any[] }>('my-registrations', 'GET', undefined, token),
};
