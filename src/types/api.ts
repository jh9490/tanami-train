// types/api.ts or inside api.ts
export type Phase = 'current' | 'upcoming' | 'previous' | 'all';

export interface CourseItem {
  registration_id: number;
  live_url?: string | null;
  student: {
    id : number
  },
  phase: Phase;
  activity: {
    id: number;
    date: string | null;
    end_date: string | null;
    status: number | null;
    grade: string | null;
    live?: number | null;
    live_url?: string | null;
  } | null;
  course: {
    id: number;
    name_ar: string;
    name_en: string;
    hours: number;
  } | null;
  trainer: {
    id: number;
    full_name_ar: string | null;
    email: string | null;
  } | null;
}

export interface CoursesResponse {
  result: 1 | 0;
  student?: {
    id: number;
    name_ar: string | null;
    name_en: string | null;
    mobile: string;
  };
  phase?: Phase;
  count?: number;
  items?: CourseItem[];
  message?: string;
}


// types/api.ts
export interface CourseLibraryItem {
  id?: number | string;
  title?: string;
  url?: string;
  type?: 'pdf' | 'video' | 'link' | string;
}

export interface CourseCertificate {
  available?: boolean;
  url?: string;   // download / view certificate
  code?: string;  // verification code (if any)
  status_text?: string;
}

export interface GetCourseResponse {
  ok: boolean;
  course?: {
    id: number;
    name?: string;
    name_ar?: string;
    name_en?: string;
    course_head_lines?: string; // HTML
    days?: number;
    hours?: number;
    cost?: number;
    grade?: string | null;
    package_id?: number;
  };
}


export interface RegisterPushBody  {
  profile_id: number | null;
  device_id: string;
  platform: 'android' | 'ios' | 'web';
  token: string;
  app_version?: string;
  device_model?: string;
};



/** New: Profile type used by GET/UPDATE profile */
export interface Profile {
  id: number;
  student_id?: number | null;
  mobile?: string | null;
  fullname_ar: string | null;
  fullname_en: string | null;
  email: string | null;
  title_ar: string | null;
  title_en: string | null;
  address_ar: string | null;
  address_en: string | null;
  date_of_birth: string | null; // "YYYY-MM-DD"
  // server-side status fields (may be omitted in some responses)
  pending_approval?: number;     // 0 | 1
  last_submitted_at?: string | null; // "YYYY-MM-DD HH:mm:ss"
  approved_at?: string | null;       // "YYYY-MM-DD HH:mm:ss"
}

/** New: payload for partial update (all optional + nullable) */
export type UpdateProfileBody = Partial<{
  fullname_ar: string | null;
  fullname_en: string | null;
  email: string | null;
  title_ar: string | null;
  title_en: string | null;
  address_ar: string | null;
  address_en: string | null;
  date_of_birth: string | null;
}>;


export type RegisterRequestBody = { activity_id: number; online?: 0|1 };
export type RegisterRequestResponse = {
  ok: true;
  message?: string;
  request: {
    id: number;
    user_id: number;
    activity_id: number;
    online: number;
    status: number;
  };
};

export interface RegistrationRequestItem {
  id: number;
  user_id: number;
  activity_id: number;
  online: 0 | 1;
  status: 0 | 1 | 2;
  created_at?: string | null;
  updated_at?: string | null;
  activity_date?: string | null;
  activity_end_date?: string | null;
  course?: {
    id?: number | null;
    name_ar?: string | null;
    name_en?: string | null;
  } | null;
}

export interface CertificateIssue {
  id?: number;
  certificate_id?: string | null;
  serial?: string | null;
  date?: string | null;
  grade?: string | null;
  status?: number | null;
  language?: string | null;
  url?: string | null;
}

export interface HistoricalCertificateItem {
  id: number;
  source: 'activity' | 'legacy_course';
  activity_id: number | null;
  course_id?: number | null;
  certificate_id?: string | null;
  serial?: string | null;
  date?: string | null;
  grade?: string | null;
  status?: number | null;
  course_name_ar?: string | null;
  course_name_en?: string | null;
  hours?: number | null;
  course?: {
    id?: number | null;
    name_ar?: string | null;
    name_en?: string | null;
    hours?: number | null;
  } | null;
  activity?: {
    id?: number | null;
    course_name_ar?: string | null;
    course_name_en?: string | null;
    hours?: number | null;
  } | null;
  issues?: CertificateIssue[];
}

export interface CertificatesResponse {
  ok: true;
  count?: number;
  items?: HistoricalCertificateItem[];
  certificates?: HistoricalCertificateItem[];
}
