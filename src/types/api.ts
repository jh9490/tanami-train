// types/api.ts or inside api.ts
export type Phase = 'current' | 'upcoming' | 'previous' | 'all';

export interface CourseItem {
  registration_id: number;
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
export type RegisterRequestResponse = { ok: true; request: { id:number; user_id:number; activity_id:number; online:number; status:number } } | { ok:false; error:string };