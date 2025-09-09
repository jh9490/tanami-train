// src/services/api.ts
const BASE_URL = 'http://tanamitrain.com/tanamiAdmin/api/mobile-app';

type HttpMethod = 'GET' | 'POST';


async function request<T>(path: string, method: 'GET'|'POST'|'PATCH' = 'GET', body?: any, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
  });
  let json: any = null;
  try { json = await res.json(); } catch {}
  if (!res.ok || (json && json.ok === false)) {
    throw new Error(json?.error ?? json?.message ?? `HTTP_${res.status}`);
  }
  return json as T;
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

  getProfile: (token: string) =>
    request<{ ok: true; profile: { id: number; fullname_ar: string|null } }>(
      'profile', 'GET', undefined, token
    ),

  updateProfile: (token: string, data: { fullname_ar?: string|null }) =>
    request<{ ok: true; profile: { id: number; fullname_ar: string|null } }>(
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
};
