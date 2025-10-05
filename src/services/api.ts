// src/services/api.ts
const BASE_URL = 'http://tanamitrain.com/tanamiAdmin/api/mobile-app';
const BASE = 'http://tanamitrain.com/tanamiAdmin';



type HttpMethod = 'GET' | 'POST';

import { CoursesResponse, GetCourseResponse, Phase, Profile, RegisterPushBody, RegisterRequestResponse, UpdateProfileBody } from '../types/api'; // adjust import if needed

async function debugJson(url: string, headers: Record<string,string>) {
  console.log('➡️ GET', url);
  const res = await fetch(url, { method: 'GET', headers });
  const status = res.status;
  const statusText = res.statusText || '';
  const body = await res.text();
  console.log('⬅️', status, statusText, '| body preview:', body.slice(0, 180));
  let parsed: any;
  try { parsed = JSON.parse(body); }
  catch { throw new Error(`HTTP ${status} ${statusText} (not JSON)`); }
  return parsed;
}

async function request<T>(path: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: any, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
  });
  let json: any = null;
  try { json = await res.json(); } catch { }
  if (!res.ok || (json && json.ok === false)) {
    throw new Error(json?.error ?? json?.message ?? `HTTP_${res.status}`);
  }
  return json as T;
}

async function jsonFetch(url: string, opts: RequestInit = {}) {
  const res  = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...opts,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { ok: false, status: res.status, raw: text }; }
}



async function jsonFetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 10000
) {
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
    console.log('[API] ←', res.status, text.slice(0, 400)); // trim log
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, status: res.status, raw: text };
    }
  } catch (e: any) {
    console.log('[API] ✖', e?.name || e, e?.message);
    return { ok: false, error: e?.message || 'network_error' };
  } finally {
    clearTimeout(to);
  }
}



// Endpoints
export const api = {
  signup: (mobile: string, password: string, email?: string) =>
    request<{ ok: true; message: string; mobile: string; /* debug_otp?: string */ }>(
      'signup', 'POST', { mobile, password, email }
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

  // ⬇️ now returns the richer Profile (or null if none yet)
  getProfile: (token: string) =>
    request<{ ok: true; profile: Profile | null }>(
      'profile', 'GET', undefined, token
    ),

  // ⬇️ accepts partial body; returns full Profile echo from server
  updateProfile: (token: string, data: UpdateProfileBody) =>
    request<{ ok: true; profile: Profile }>(
      'profile', 'PATCH', data, token
    ),


  resendOtp: (mobile: string) =>
    request<{ ok: boolean; message?: string }>('resend-otp', 'POST', { mobile }),

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


  fetchCourses: (
    token: string,
    mobile: string,
    phase: Phase = 'all'
  ) =>
    request<CoursesResponse>(
      'my-courses',
      'POST',
      { mobile, phase },
      token
    ),




    async fetchCourseById(token: string | null | undefined, id: string | number) {
      const headers: Record<string,string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = `http://tanamitrain.com/tanamiAdmin/api/mobile-app/get-course?id=${id}`;
      return debugJson(url, headers);
    },
  
    async fetchActivityFiles(token: string | null | undefined, activityId: string | number) {
      const headers: Record<string,string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = `http://tanamitrain.com/tanamiAdmin/api/mobile-app/activity-files?id=${activityId}`;
      return debugJson(url, headers);
    },
  
    async fetchCertificateByStudentActivity(token: string | null | undefined, activityId: string | number, studentId: string | number) {
      const headers: Record<string,string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = `http://tanamitrain.com/tanamiAdmin/api/mobile-app/certi-by-student-activity?activity_id=${activityId}&student_id=${studentId}`;
      return debugJson(url, headers);
    },

    async registerPushToken(body: RegisterPushBody) {
      const res = await fetch('http://tanamitrain.com/tanamiAdmin/api/fcm/register', {
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
      return jsonFetch(`${BASE}/api/fcm/inbox-ack`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    async inboxList(profileId: number, limit = 20, offset = 0) {
      const url = `${BASE}/api/fcm/inbox-list?profile_id=${profileId}&limit=${limit}&offset=${offset}`;
      return jsonFetchWithTimeout(url);
    },
  
    async inboxOpen(profileId: number, inboxId: number) {
      return jsonFetchWithTimeout(`${BASE}/api/fcm/inbox-open`, {
        method: 'POST',
        body: JSON.stringify({ profile_id: profileId, inbox_id: inboxId }),
      });
    },

     registerForActivity: (token: string, activity_id: number, online: 0|1 = 0) =>
      request<RegisterRequestResponse>('register-request', 'POST', { activity_id, online }, token),
  
     myRegistrations: (token: string) =>
      request<{ ok: true; items: any[] }>('my-registrations', 'GET', undefined, token),
};
